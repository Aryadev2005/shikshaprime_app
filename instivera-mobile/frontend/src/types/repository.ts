export interface RepositoryCategory {
  id: number;
  name: string;
  subject_id: number | null;
  class_id: number | null;
  description: string | null;
  fileCount: number;
  created_at: string;
}

export interface RepositoryFile {
  id: number;
  category_id: number;
  title: string;
  description: string | null;
  file_path: string;
  file_type: string | null;
  file_size_kb: number | null;
  uploaded_by: string | null;
  uploaded_by_type: 'ADMIN' | 'TEACHER' | null;
  created_at: string;
}
