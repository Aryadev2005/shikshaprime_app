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
    const res = await publicAxios.get('/registration/academic-years');
    return unwrap<AcademicYear[]>(res.data) ?? [];
  },

  getPrograms: async (): Promise<Program[]> => {
    const res = await publicAxios.get('/registration/programs');
    return unwrap<Program[]>(res.data) ?? [];
  },

  getDepartments: async (): Promise<Department[]> => {
    const res = await publicAxios.get('/registration/departments');
    return unwrap<Department[]>(res.data) ?? [];
  },

  getClasses: async (): Promise<ClassItem[]> => {
    const res = await publicAxios.get('/registration/classes');
    return unwrap<ClassItem[]>(res.data) ?? [];
  },

  getFeeStructure: async (): Promise<FeeStructure[]> => {
    const res = await publicAxios.get('/registration/fee-structure');
    return unwrap<FeeStructure[]>(res.data) ?? [];
  },

  submitRegistration: async (payload: RegistrationSubmitPayload): Promise<RegistrationResponse> => {
    const res = await publicAxios.post('/registration/submit', payload);
    return unwrap<RegistrationResponse>(res.data);
  },

  getRegistrationStatus: async (regId: string): Promise<RegistrationStatusResponse> => {
    const res = await publicAxios.get(`/registration/status/${regId}`);
    return unwrap<RegistrationStatusResponse>(res.data);
  },
};
