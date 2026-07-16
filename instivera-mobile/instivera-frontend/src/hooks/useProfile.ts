import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/modules/profile.api';

export const useMyProfile = () =>
  useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileApi.getMyProfile,
    staleTime: 300_000,
  });
