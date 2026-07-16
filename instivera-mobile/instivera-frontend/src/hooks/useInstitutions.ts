import { useQuery } from '@tanstack/react-query';
import { institutionsApi } from '../api/modules/institutions.api';

export const useInstitutions = () =>
  useQuery({
    queryKey: ['institutions'],
    queryFn: institutionsApi.getInstitutions,
    staleTime: 5 * 60_000,
  });
