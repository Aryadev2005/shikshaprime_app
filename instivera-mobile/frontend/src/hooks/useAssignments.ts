import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentApi } from '../api/modules/assignment.api';
import { CreateAssignmentPayload, GradeSubmissionPayload } from '../types/assignment';

const ASSIGNMENT_KEYS = {
  list: ['assignments'] as const,
  detail: (id: string) => ['assignment', id] as const,
  metadata: ['assignments', 'metadata'] as const,
};

export const useAssignmentList = () =>
  useQuery({
    queryKey: ASSIGNMENT_KEYS.list,
    queryFn: assignmentApi.getAssignments,
    staleTime: 120_000,
  });

export const useAssignmentDetail = (id: string) =>
  useQuery({
    queryKey: ASSIGNMENT_KEYS.detail(id),
    queryFn: () => assignmentApi.getAssignmentById(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

export const useAssignmentMetadata = () =>
  useQuery({
    queryKey: ASSIGNMENT_KEYS.metadata,
    queryFn: assignmentApi.getAssignmentMetadata,
    staleTime: 300_000,
  });

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => assignmentApi.submitAssignment(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.list });
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssignmentPayload) => assignmentApi.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.list });
    },
  });
};

export const useGradeSubmission = (assignmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: string; data: GradeSubmissionPayload }) =>
      assignmentApi.gradeSubmission(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.detail(assignmentId) });
    },
  });
};
