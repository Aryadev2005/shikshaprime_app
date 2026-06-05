import axios from 'axios';
import config from '../config';

const upstream = (path: string) => `${config.identityServiceUrl}/api/sr${path}`;

const forward = (tenant: string) => ({
  headers: {
    'x-tenant': tenant,
    'Content-Type': 'application/json',
  },
});

export const registrationService = {
  getAcademicYears: (tenant: string) =>
    axios.get(upstream('/academic-years'), { headers: forward(tenant).headers }),

  getPrograms: (tenant: string) =>
    axios.get(upstream('/programs'), { headers: forward(tenant).headers }),

  getDepartments: (tenant: string) =>
    axios.get(upstream('/departments'), { headers: forward(tenant).headers }),

  getClasses: (tenant: string) =>
    axios.get(upstream('/classes'), { headers: forward(tenant).headers }),

  getFeeStructure: (tenant: string) =>
    axios.get(upstream('/fee-structure'), { headers: forward(tenant).headers }),

  submitRegistration: (payload: Record<string, unknown>, tenant: string) =>
    axios.post(upstream('/register'), payload, { headers: forward(tenant).headers }),

  getRegistrationStatus: (regId: string, tenant: string) =>
    axios.get(upstream(`/registration/${regId}`), { headers: forward(tenant).headers }),
};
