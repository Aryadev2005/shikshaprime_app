import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';

jest.mock('../src/services/clients/index.ts', () => ({
  identityClient: { request: jest.fn() },
  studentClient: { request: jest.fn() },
  paymentClient: { request: jest.fn() },
  teacherClient: { request: jest.fn() },
  chatClient: { request: jest.fn() },
  feesClient: { request: jest.fn() },
}));

const JWT_SECRET = process.env.JWT_SECRET as string;

const makeToken = (role: string, userCode = 'STU-001') =>
  jwt.sign(
    { username: 'testuser', role, email: 'test@example.com', user_code: userCode, user_type: role },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

const mockPendingPayments = [
  { id: 'PAY-001', amount: 5000, paid_amount: 0, status: 'PENDING', due_date: '2026-07-01' },
];

const mockDues = [
  { id: 'DUE-001', fee_head_name: 'Tuition', amount: 10000, paid_amount: 5000, balance: 5000, due_date: '2026-07-01', status: 'PARTIAL' },
  { id: 'DUE-002', fee_head_name: 'Transport', amount: 2000, paid_amount: 2000, balance: 0, due_date: '2026-04-01', status: 'PAID' },
];

describe('Payment Routes', () => {
  const app = createApp();
  const { paymentClient, feesClient } = require('../src/services/clients/index.ts');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /api/mobile/payment/summary ─────────────────────────────────────

  describe('GET /api/mobile/payment/summary', () => {
    it('aggregates data correctly when both services respond', async () => {
      paymentClient.request.mockResolvedValueOnce({
        data: { status: 1, data: mockPendingPayments, message: 'OK' },
      });
      feesClient.request.mockResolvedValueOnce({
        data: { status: 1, data: { dues: mockDues }, message: 'OK' },
      });

      const res = await request(app)
        .get('/api/mobile/payment/summary')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea');

      expect(res.status).toBe(200);
      expect(res.body.data.outstanding.totalAmount).toBe(5000);
      expect(res.body.data.annualTotal).toBe(12000);
      expect(res.body.data.paidSoFar).toBe(7000);
      expect(res.body.data.breakdown).toHaveLength(2);
      expect(res.body.data.primaryPaymentId).toBe('PAY-001');
    });

    it('falls back gracefully when fees service is down', async () => {
      paymentClient.request.mockResolvedValueOnce({
        data: { status: 1, data: mockPendingPayments, message: 'OK' },
      });
      feesClient.request.mockRejectedValueOnce(new Error('fees service unavailable'));

      const res = await request(app)
        .get('/api/mobile/payment/summary')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea');

      expect(res.status).toBe(200);
      expect(res.body.data.outstanding.totalAmount).toBe(5000);
      expect(res.body.data.recentPayments).toHaveLength(0);
    });

    it('always uses JWT user_code as studentId, ignoring query params', async () => {
      paymentClient.request.mockResolvedValueOnce({
        data: { status: 1, data: mockPendingPayments, message: 'OK' },
      });
      feesClient.request.mockResolvedValueOnce({
        data: { status: 1, data: { dues: mockDues }, message: 'OK' },
      });

      const token = makeToken('student', 'STU-001');
      await request(app)
        .get('/api/mobile/payment/summary?studentId=OTHER-STUDENT')
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant', 'collegea');

      // feesClient must be called with /dues/STU-001 (JWT user_code), not OTHER-STUDENT
      expect(feesClient.request).toHaveBeenCalledWith(
        expect.any(String),
        'collegea',
        expect.objectContaining({ url: '/dues/STU-001' }),
      );
    });

    it('returns 403 when called by a teacher', async () => {
      const res = await request(app)
        .get('/api/mobile/payment/summary')
        .set('Authorization', `Bearer ${makeToken('teacher')}`)
        .set('x-tenant', 'collegea');

      expect(res.status).toBe(403);
    });
  });

  // ─── POST /api/mobile/payment/initiate ───────────────────────────────────

  describe('POST /api/mobile/payment/initiate', () => {
    it('returns redirectUrl on success', async () => {
      paymentClient.request.mockResolvedValueOnce({
        data: {
          status: 1,
          data: {
            paymentId: 'PAY-001',
            merchantOrderId: 'MO-123',
            amount: 5000,
            redirectUrl: 'https://phonepe.com/pay/abc123',
            expiresAt: '2026-06-03T12:00:00Z',
          },
          message: 'OK',
        },
      });

      const res = await request(app)
        .post('/api/mobile/payment/initiate')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea')
        .send({ paymentId: 'PAY-001', amount: 5000 });

      expect(res.status).toBe(200);
      expect(res.body.data.redirectUrl).toBe('https://phonepe.com/pay/abc123');
      expect(res.body.data.merchantOrderId).toBe('MO-123');
    });

    it('returns 400 when paymentId is missing', async () => {
      const res = await request(app)
        .post('/api/mobile/payment/initiate')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea')
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
