import config from '../../config';
import { createApiClient } from './api-client-factory';
import type { ApiClientMethods } from './api-client-factory';

export type { ApiClientMethods };

const createClients = () => ({
  identityClient: createApiClient({
    name: 'IdentityService',
    baseURL: config.identityServiceUrl,
  }),
  studentClient: createApiClient({
    name: 'StudentService',
    baseURL: config.studentServiceUrl,
  }),
  paymentClient: createApiClient({
    name: 'PaymentService',
    baseURL: config.paymentServiceUrl,
  }),
  teacherClient: createApiClient({
    name: 'TeacherService',
    baseURL: config.teacherServiceUrl,
  }),
  chatClient: createApiClient({
    name: 'ChatService',
    baseURL: config.chatServiceUrl,
  }),
  feesClient: createApiClient({
    name: 'FeesService',
    baseURL: config.feesServiceUrl,
  }),
});

const clients = createClients();

export const {
  identityClient,
  studentClient,
  paymentClient,
  teacherClient,
  chatClient,
  feesClient,
} = clients;
