import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
// Shared resolver — a private `localhost` fallback here meant a physical
// device pointed registration calls at the phone itself.
import { API_URL } from '../../config/env';
import {
  AcademicYear,
  Program,
  Department,
  ClassItem,
  FeeStructure,
  RegistrationSubmitPayload,
  RegistrationResponse,
  RegistrationStatusResponse,
} from '../../types/registration';

// Public client — no Authorization header (user is not logged in yet)
const publicAxios = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Still forward x-tenant so the gateway can route correctly
publicAxios.interceptors.request.use(async (config) => {
  const tenant = await SecureStore.getItemAsync('selectedInstitutionTenant');
  if (tenant) {
    config.headers['x-tenant'] = tenant;
  }
  return config;
});

const unwrap = <T>(data: { data: T; status: number; message: string } | T): T =>
  data && typeof data === 'object' && 'data' in (data as object)
    ? (data as { data: T }).data
    : (data as T);

export const registrationApi = {
  getAcademicYears: async (): Promise<AcademicYear[]> => {
    const res = await publicAxios.get('/api/identity/sr/academic-years');
    return unwrap<AcademicYear[]>(res.data) ?? [];
  },

  getPrograms: async (): Promise<Program[]> => {
    const res = await publicAxios.get('/api/identity/sr/programs');
    return unwrap<Program[]>(res.data) ?? [];
  },

  getDepartments: async (): Promise<Department[]> => {
    const res = await publicAxios.get('/api/identity/sr/departments');
    return unwrap<Department[]>(res.data) ?? [];
  },

  getClasses: async (): Promise<ClassItem[]> => {
    const res = await publicAxios.get('/api/identity/sr/classes');
    return unwrap<ClassItem[]>(res.data) ?? [];
  },

  getFeeStructure: async (): Promise<FeeStructure[]> => {
    const res = await publicAxios.get('/api/identity/sr/fee-structure');
    return unwrap<FeeStructure[]>(res.data) ?? [];
  },

  // NOTE: admission-service's registerApplicant is a multipart endpoint that
  // rejects the request with 400 unless an `hs_registration_certificate` file
  // part is present. The sign-up form collects no documents, so this call
  // cannot succeed until either the app adds a document step or the backend
  // exposes a JSON-only registration route. See INTEGRATION_LOG.md.
  submitRegistration: async (payload: RegistrationSubmitPayload): Promise<RegistrationResponse> => {
    const res = await publicAxios.post('/api/admission/registerApplicant', payload);
    return unwrap<RegistrationResponse>(res.data);
  },

  // NOTE: no backend route exists for looking a registration up by id.
  // Left pointing at the old path deliberately rather than guessed at — it
  // will 404 until the endpoint is built. See INTEGRATION_LOG.md.
  getRegistrationStatus: async (regId: string): Promise<RegistrationStatusResponse> => {
    const res = await publicAxios.get(`/registration/status/${regId}`);
    return unwrap<RegistrationStatusResponse>(res.data);
  },
};
