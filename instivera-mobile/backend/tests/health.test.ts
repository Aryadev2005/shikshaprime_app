import request from 'supertest';
import { createApp } from '../src/app';

describe('Health Endpoints', () => {
  const app = createApp();

  describe('GET /health', () => {
    it('should return 200 with status 1', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(1);
      expect(response.body.data.service).toBe('instivera-mobile-bff');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.message).toBe('OK');
    });
  });

  describe('GET /api/mobile/unknown', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/mobile/unknown')
        .set('x-tenant', 'collegea');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe(0);
      expect(response.body.message).toMatch(/not found/i);
    });
  });

  describe('GET /api/mobile/health (without tenant)', () => {
    it('should return 400 when x-tenant header is missing', async () => {
      const response = await request(app).get('/api/mobile/health');

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(0);
      expect(response.body.message).toMatch(/x-tenant/i);
    });
  });

  describe('GET /api/mobile/health (with tenant)', () => {
    it('should return 200 when x-tenant header is provided', async () => {
      const response = await request(app)
        .get('/api/mobile/health')
        .set('x-tenant', 'collegea');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(1);
    });
  });
});
