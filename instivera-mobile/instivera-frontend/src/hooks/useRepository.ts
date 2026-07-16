import { useQuery } from '@tanstack/react-query';
import { repositoryApi } from '../api/modules/repository.api';

export const useRepositoryCategories = () =>
  useQuery({
    queryKey: ['repository', 'categories'],
    queryFn: repositoryApi.getCategories,
    staleTime: 300_000,
  });

export const useRepositoryFiles = (categoryId: string) =>
  useQuery({
    queryKey: ['repository', 'files', categoryId],
    queryFn: () => repositoryApi.getFilesByCategory(categoryId),
    enabled: Boolean(categoryId),
    staleTime: 120_000,
  });
