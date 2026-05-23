
import apiClient from "./apiClient";

export interface MasterDepartment {
          id: number;
          name: string;
          code: string;
}

export interface ChildDepartment {
          id: number;
          master_department_id: number;
          name: string;
          code: string;
}

export interface Subject {
          id: number;
          child_department_id: number;
          name: string;
          code: string;
}

export const fetchMasterDepartments = async () => {
          const response = await apiClient.get("/student/departments/master");
          return response.data;
};

export const fetchChildDepartments = async (masterId: number) => {
          const response = await apiClient.get(`/student/departments/master/${masterId}/child`);
          return response.data;
};

export const fetchSubjects = async (childId: number) => {
          const response = await apiClient.get(`/student/departments/child/${childId}/subjects`);
          return response.data;
};
