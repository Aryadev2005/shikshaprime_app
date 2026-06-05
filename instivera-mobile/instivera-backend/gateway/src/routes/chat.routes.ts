import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/auth-middleware';
import config from '../config';

const forward = async (
  req: Request,
  res: Response,
  next: NextFunction,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
): Promise<void> => {
  try {
    const response = await axios({
      method,
      url: `${config.chatServiceUrl}${path}`,
      headers: {
        Authorization: req.headers.authorization ?? '',
        'x-tenant': req.headers['x-tenant'] ?? '',
        'Content-Type': 'application/json',
      },
      data: method !== 'get' ? req.body : undefined,
      params: method === 'get' ? req.query : undefined,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      next(err);
    }
  }
};

export const createChatRoutes = (): Router => {
  const router = Router();

  router.get('/conversations', requireAuth, (req, res, next) =>
    forward(req, res, next, 'get', '/chat/conversations'),
  );

  router.post('/conversations/direct', requireAuth, (req, res, next) =>
    forward(req, res, next, 'post', '/chat/conversations/direct'),
  );

  router.post('/conversations/group', requireAuth, (req, res, next) =>
    forward(req, res, next, 'post', '/chat/conversations/group'),
  );

  router.get('/conversations/:id/messages', requireAuth, (req, res, next) =>
    forward(req, res, next, 'get', `/chat/conversations/${req.params.id}/messages`),
  );

  router.post('/conversations/:id/messages', requireAuth, (req, res, next) =>
    forward(req, res, next, 'post', `/chat/conversations/${req.params.id}/messages`),
  );

  router.put('/conversations/:id/read', requireAuth, (req, res, next) =>
    forward(req, res, next, 'put', `/chat/conversations/${req.params.id}/read`),
  );

  return router;
};
