import apiClient from "./apiClient";

export async function createExamSchedule(formData: any) {
    const { data } = await apiClient.post(`/examination/schedule`, formData);
    return { status: data.status, data: data.data, message: data.message };
}
export async function getAllScheduledExams() {
    const { data } = await apiClient.get("/examination/schedules/upcoming");
    return { status: data.status, data: data.data, message: data.message };
}
export async function checkRoomAvailability(payload: any) {
    const { data } = await apiClient.post("/examination/schedule/check-room", payload);
    return { status: data.status, data: data.data, message: data.message };
}