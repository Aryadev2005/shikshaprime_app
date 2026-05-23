import apiClient from "./apiClient";

// Get Notice
export async function getNotices(page = 1, pageSize = 10) {
    const { data } = await apiClient.get(`/identity/notice/all?page=${page}&pageSize=${pageSize}`);
    return { status: data.status, data: data.data, message: data.message };
}

// Save Notice
export async function saveNotice(payload: FormData) {
    const { data } = await apiClient.post("/identity/notice/", payload);
    return { status: data.status, data: data.data, message: data.message };
}

// Delete Notice
export async function deleteNotice(id: any) {
    const { data } = await apiClient.delete(`/identity/notice/${id}`);
    return { status: data.status, data: data.data, message: data.message }
}

// View Notice data by ID
export async function getNoticesById(id:any) {
    const { data } = await apiClient.get(`/identity/notice/${id}`);
    return { status: data.status, data: data.data, message: data.message };
}

// Get notices by last 6th mothts
export async function getNoticesLatest() {
    const { data } = await apiClient.get(`/identity/notice/recent`);
    return { status: data.status, data: data.data, message: data.message };
}