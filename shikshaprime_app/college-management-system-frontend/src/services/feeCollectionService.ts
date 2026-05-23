import apiClient from "./apiClient";

export async function searchStudentWithDues(query: string) {
  const { data } = await apiClient.get("/fees-management/search", { params: { query} });
  return data;
}

export async function collectFees(payload: any) {
  const { data } = await apiClient.post("/fees-management/collect", payload);
  return data;
}

export async function processOnlinePayment(orderId: string) {
  const { data } = await apiClient.post("/fees-management/online/process", {
    orderId,
  });

  return data.data; // { receipt_no, voucher_no, amount, student_id }
}

export async function processOnlineRegistrationPayment(orderId: string) {
  const { data } = await apiClient.post("/fees-management/online/process-registration", {
    orderId,
  });

  return data.data; // { receipt_no, voucher_no, amount, student_id }
}