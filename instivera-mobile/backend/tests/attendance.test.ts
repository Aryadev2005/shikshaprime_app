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

describe('Attendance Routes', () => {
  const app = createApp();
  const { studentClient } = require('../src/services/clients/index.ts');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /api/mobile/attendance/my-records ───────────────────────────────

  describe('GET /api/mobile/attendance/my-records', () => {
    it('returns heatmap starting at April 1 of the current year', async () => {
      const today = new Date();
      const presentDate = `${today.getFullYear()}-04-15`;

      studentClient.request.mockResolvedValueOnce({
        data: {
          status: 1,
          data: {
            records: [
              {
                attendance_id: '1',
                student_id: 'STU-001',
                attendance_date: presentDate,
                attendance_status: 'PRESENT',
              },
            ],
            summary: {
              present_days: 1,
              absent_days: 0,
              total_days: 1,
              attendance_percentage: 100,
            },
          },
          message: 'OK',
        },
      });

      const res = await request(app)
        .get('/api/mobile/attendance/my-records')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(1);

      const heatmap: Array<{ date: string; status: string | null }> = res.body.data.heatmap;
      const expectedStart = `${today.getFullYear()}-04-01`;

      expect(heatmap[0].date).toBe(expectedStart);

      const presentCell = heatmap.find((c) => c.date === presentDate);
      expect(presentCell?.status).toBe('PRESENT');

      const noCellDate = `${today.getFullYear()}-04-02`;
      const noDataCell = heatmap.find((c) => c.date === noCellDate);
      expect(noDataCell?.status).toBeNull();
    });

    it('returns 403 when role is teacher', async () => {
      const res = await request(app)
        .get('/api/mobile/attendance/my-records')
        .set('Authorization', `Bearer ${makeToken('teacher')}`)
        .set('x-tenant', 'collegea');

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(0);
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .get('/api/mobile/attendance/my-records')
        .set('x-tenant', 'collegea');

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/mobile/attendance/bulk-mark ───────────────────────────────

  describe('POST /api/mobile/attendance/bulk-mark', () => {
    it('returns 200 with markedCount on success', async () => {
      studentClient.request.mockResolvedValueOnce({
        data: { status: 1, data: { count: 3 }, message: 'Attendance marked' },
      });

      const today = new Date().toISOString().slice(0, 10);

      const res = await request(app)
        .post('/api/mobile/attendance/bulk-mark')
        .set('Authorization', `Bearer ${makeToken('teacher')}`)
        .set('x-tenant', 'collegea')
        .send({
          students: [
            { student_id: 's1', student_code: 'SC01', student_name: 'Alice', status: 'PRESENT' },
            { student_id: 's2', student_code: 'SC02', student_name: 'Bob', status: 'ABSENT' },
            { student_id: 's3', student_code: 'SC03', student_name: 'Carol', status: 'LATE' },
          ],
          date: today,
          classInfo: { class_id: 'CLS-1A' },
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(1);
      expect(res.body.data.markedCount).toBe(3);
      expect(res.body.data.date).toBe(today);

      // LATE must be mapped to PRESENT before forwarding to upstream
      const upstreamBody = studentClient.request.mock.calls[0][2].data;
      const carolUpstream = upstreamBody.students.find(
        (s: { student_id: string }) => s.student_id === 's3',
      );
      expect(carolUpstream.attendance_status).toBe('PRESENT');
    });

    it('returns 400 for a future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().slice(0, 10);

      const res = await request(app)
        .post('/api/mobile/attendance/bulk-mark')
        .set('Authorization', `Bearer ${makeToken('teacher')}`)
        .set('x-tenant', 'collegea')
        .send({
          students: [
            { student_id: 's1', student_code: 'SC01', student_name: 'Alice', status: 'PRESENT' },
          ],
          date: futureDateStr,
          classInfo: { class_id: 'CLS-1A' },
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(0);
      expect(res.body.message).toMatch(/future/i);
    });

    it('returns 403 when role is student', async () => {
      const today = new Date().toISOString().slice(0, 10);

      const res = await request(app)
        .post('/api/mobile/attendance/bulk-mark')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea')
        .send({
          students: [
            { student_id: 's1', student_code: 'SC01', student_name: 'Alice', status: 'PRESENT' },
          ],
          date: today,
          classInfo: { class_id: 'CLS-1A' },
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(0);
    });

    it('returns 400 when students array is empty', async () => {
      const today = new Date().toISOString().slice(0, 10);

      const res = await request(app)
        .post('/api/mobile/attendance/bulk-mark')
        .set('Authorization', `Bearer ${makeToken('teacher')}`)
        .set('x-tenant', 'collegea')
        .send({ students: [], date: today, classInfo: { class_id: 'CLS-1A' } });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(0);
    });
  });
});
