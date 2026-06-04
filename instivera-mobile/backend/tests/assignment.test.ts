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

const makeToken = (role: string, userCode = 'USR-001') =>
  jwt.sign(
    { username: 'testuser', role, email: 'test@example.com', user_code: userCode, user_type: role },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

describe('Assignment Routes', () => {
  const app = createApp();
  const { studentClient, teacherClient } = require('../src/services/clients/index.ts');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /api/mobile/assignments ─────────────────────────────────────────

  describe('GET /api/mobile/assignments', () => {
    it('student gets list with counters', async () => {
      studentClient.request.mockResolvedValueOnce({
        data: {
          status: 1,
          data: {
            stats: { total: 5, pending: 2, submitted: 2, graded: 1 },
            assignments: [
              {
                id: 'A1',
                title: 'Math Homework',
                subject_name: 'Mathematics',
                due_date: '2026-06-10',
                status: 'PENDING',
              },
            ],
          },
          message: 'OK',
        },
      });

      const res = await request(app)
        .get('/api/mobile/assignments')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(1);
      expect(res.body.data.counters).toMatchObject({
        total: 5,
        pending: 2,
        submitted: 2,
        graded: 1,
      });
      expect(res.body.data.assignments[0]).toMatchObject({
        id: 'A1',
        title: 'Math Homework',
        subjectName: 'Mathematics',
        status: 'PENDING',
        progress: 0,
      });
    });

    it('teacher gets list without counters', async () => {
      teacherClient.request.mockResolvedValueOnce({
        data: {
          status: 1,
          data: [
            {
              id: 'A2',
              title: 'Essay',
              subject_name: 'English',
              due_date: '2026-06-12',
              status: 'PENDING',
            },
          ],
          message: 'OK',
        },
      });

      const res = await request(app)
        .get('/api/mobile/assignments')
        .set('Authorization', `Bearer ${makeToken('teacher')}`)
        .set('x-tenant', 'collegea');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(1);
      expect(res.body.data.counters).toBeUndefined();
      expect(res.body.data.assignments[0].id).toBe('A2');
    });
  });

  // ─── PUT /api/mobile/assignments/grade/:submissionId ─────────────────────

  describe('PUT /api/mobile/assignments/grade/:submissionId', () => {
    it('returns 403 when called by a student', async () => {
      const res = await request(app)
        .put('/api/mobile/assignments/grade/SUB-001')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea')
        .send({ grade: 'A', marks_obtained: 90 });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(0);
    });

    it('teacher grades a submission successfully', async () => {
      teacherClient.request.mockResolvedValueOnce({
        data: { status: 1, data: {}, message: 'Graded' },
      });

      const res = await request(app)
        .put('/api/mobile/assignments/grade/SUB-001')
        .set('Authorization', `Bearer ${makeToken('teacher')}`)
        .set('x-tenant', 'collegea')
        .send({ grade: 'A', marks_obtained: 90, feedback: 'Great work!' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(1);
      expect(teacherClient.request).toHaveBeenCalledWith(
        expect.any(String),
        'collegea',
        expect.objectContaining({
          method: 'PUT',
          url: '/submissions/SUB-001/grade',
        }),
      );
    });
  });

  // ─── POST /api/mobile/assignments/submit ─────────────────────────────────

  describe('POST /api/mobile/assignments/submit', () => {
    it('proxies the file to student-service and returns submission details', async () => {
      studentClient.request.mockResolvedValueOnce({
        data: {
          status: 1,
          data: {
            submission_id: 'SUB-NEW',
            assignment_id: 'ASMT-001',
            submission_date: '2026-06-03',
            status: 'SUBMITTED',
          },
          message: 'Submitted',
        },
      });

      const res = await request(app)
        .post('/api/mobile/assignments/submit')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea')
        .field('assignment_id', 'ASMT-001')
        .attach('assignmentFile', Buffer.from('%PDF-1.4 test content'), {
          filename: 'homework.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(1);
      expect(res.body.data.submissionId).toBe('SUB-NEW');
      expect(res.body.data.status).toBe('SUBMITTED');

      // File should be forwarded to student-service
      expect(studentClient.request).toHaveBeenCalledWith(
        expect.any(String),
        'collegea',
        expect.objectContaining({ method: 'POST', url: '/assignments/submit' }),
      );
    });

    it('returns 400 when file is missing', async () => {
      const res = await request(app)
        .post('/api/mobile/assignments/submit')
        .set('Authorization', `Bearer ${makeToken('student')}`)
        .set('x-tenant', 'collegea')
        .send({ assignment_id: 'ASMT-001' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(0);
    });

    it('returns 403 when called by a teacher', async () => {
      const res = await request(app)
        .post('/api/mobile/assignments/submit')
        .set('Authorization', `Bearer ${makeToken('teacher')}`)
        .set('x-tenant', 'collegea')
        .field('assignment_id', 'ASMT-001')
        .attach('assignmentFile', Buffer.from('%PDF test'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(403);
    });
  });
});
