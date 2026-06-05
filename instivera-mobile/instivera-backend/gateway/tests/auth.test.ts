import request from 'supertest';
import { createApp } from '../src/app';

// Mock the identity client
jest.mock('../src/services/clients/index.ts', () => ({
  identityClient: {
    request: jest.fn(),
  },
}));

describe('Auth Routes', () => {
  const app = createApp();
  const mockIdentityClient = require('../src/services/clients/index.ts').identityClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/mobile/auth/login', () => {
    it('should return 200 with user and token on successful login', async () => {
      const mockResponse = {
        data: {
          status: 1,
          data: {
            role: 'student',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            username: 'john_doe',
            user_id: '123',
            user_type: 'student',
            user_code: 'STU-001',
          },
          token: 'jwt-token-here',
          message: 'Login Successful',
        },
      };

      mockIdentityClient.request.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/mobile/auth/login')
        .set('x-tenant', 'collegea')
        .send({
          username: 'john_doe',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(1);
      expect(response.body.data.user).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        avatarInitials: 'JD',
      });
      expect(response.body.data.token).toBe('jwt-token-here');
      expect(mockIdentityClient.request).toHaveBeenCalledWith(
        undefined,
        'collegea',
        expect.objectContaining({
          method: 'POST',
          url: '/authenticate-user',
          data: { username: 'john_doe', password: 'password123' },
        }),
      );
    });

    it('should return 400 when username or password is missing', async () => {
      const response = await request(app)
        .post('/api/mobile/auth/login')
        .set('x-tenant', 'collegea')
        .send({
          username: 'john_doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(0);
      expect(response.body.message).toMatch(/required/i);
    });

    it('should return 400 when x-tenant header is missing', async () => {
      const response = await request(app)
        .post('/api/mobile/auth/login')
        .send({
          username: 'john_doe',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(0);
      expect(response.body.message).toMatch(/x-tenant/i);
    });
  });

  describe('POST /api/mobile/auth/send-otp', () => {
    it('should return 200 on successful OTP send', async () => {
      const mockResponse = {
        data: {
          status: 1,
          data: {
            email: 'john@example.com',
            expiresIn: 600,
          },
          message: 'OTP sent to your email address',
        },
      };

      mockIdentityClient.request.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/mobile/auth/send-otp')
        .set('x-tenant', 'collegea')
        .send({
          email: 'john@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(1);
      expect(mockIdentityClient.request).toHaveBeenCalledWith(
        undefined,
        'collegea',
        expect.objectContaining({
          method: 'POST',
          url: '/send-email-otp',
          data: { email: 'john@example.com' },
        }),
      );
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/mobile/auth/send-otp')
        .set('x-tenant', 'collegea')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(0);
    });
  });

  describe('POST /api/mobile/auth/verify-otp', () => {
    it('should return 200 with token on successful OTP verification', async () => {
      const mockResponse = {
        data: {
          status: 1,
          data: {
            token: 'jwt-token-here',
          },
          message: 'OTP verified successfully',
        },
      };

      mockIdentityClient.request.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/mobile/auth/verify-otp')
        .set('x-tenant', 'collegea')
        .send({
          email: 'john@example.com',
          otp: '123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(1);
      expect(response.body.data.token).toBe('jwt-token-here');
    });

    it('should return 400 when OTP is invalid', async () => {
      mockIdentityClient.request.mockResolvedValueOnce({
        data: {
          status: 0,
          data: {
            attemptsLeft: 2,
          },
          message: 'Invalid OTP',
        },
      });

      const response = await request(app)
        .post('/api/mobile/auth/verify-otp')
        .set('x-tenant', 'collegea')
        .send({
          email: 'john@example.com',
          otp: '000000',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(0);
    });
  });

  describe('POST /api/mobile/auth/validate-email', () => {
    it('should return 200 with email validation result', async () => {
      const mockResponse = {
        data: {
          status: 1,
          data: {
            exists: true,
            first_name: 'John',
            last_name: 'Doe',
          },
          message: 'Email validation successful',
        },
      };

      mockIdentityClient.request.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/mobile/auth/validate-email')
        .set('x-tenant', 'collegea')
        .send({
          email: 'john@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(1);
      expect(response.body.data.exists).toBe(true);
    });
  });
});
