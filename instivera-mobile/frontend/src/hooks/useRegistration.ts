import { useQuery, useMutation } from '@tanstack/react-query';
import { registrationApi } from '../api/modules/registration.api';
import { RegistrationSubmitPayload } from '../types/registration';

const TEN_MINUTES = 10 * 60 * 1000;

export const useAcademicYears = (tenant: string) =>
  useQuery({
    queryKey: ['registration', 'academic-years', tenant],
    queryFn: registrationApi.getAcademicYears,
    staleTime: TEN_MINUTES,
    enabled: Boolean(tenant),
  });

export const usePrograms = (tenant: string) =>
  useQuery({
    queryKey: ['registration', 'programs', tenant],
    queryFn: registrationApi.getPrograms,
    staleTime: TEN_MINUTES,
    enabled: Boolean(tenant),
  });

export const useDepartments = (tenant: string) =>
  useQuery({
    queryKey: ['registration', 'departments', tenant],
    queryFn: registrationApi.getDepartments,
    staleTime: TEN_MINUTES,
    enabled: Boolean(tenant),
  });

export const useClasses = (tenant: string) =>
  useQuery({
    queryKey: ['registration', 'classes', tenant],
    queryFn: registrationApi.getClasses,
    staleTime: TEN_MINUTES,
    enabled: Boolean(tenant),
  });

export const useFeeStructure = (tenant: string) =>
  useQuery({
    queryKey: ['registration', 'fee-structure', tenant],
    queryFn: registrationApi.getFeeStructure,
    staleTime: TEN_MINUTES,
    enabled: Boolean(tenant),
  });

export const useSubmitRegistration = () =>
  useMutation({
    mutationFn: (payload: RegistrationSubmitPayload) =>
      registrationApi.submitRegistration(payload),
  });

export const useRegistrationStatus = (regId: string | null) =>
  useQuery({
    queryKey: ['registration', 'status', regId],
    queryFn: () => registrationApi.getRegistrationStatus(regId!),
    enabled: Boolean(regId),
    staleTime: 30_000,
  });
