import api from "./api";

export async function loginUser(data) {
  const response = await api.post("/auth/login", data);
  return response.data;
}

export async function registerUser(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function forgotPassword(email) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function verifyResetCode(email, code) {
  const response = await api.post("/auth/verify-reset-code", { email, code });
  return response.data;
}

export async function resetPassword(email, code, newPassword) {
  const response = await api.post("/auth/reset-password", {
    email,
    code,
    new_password: newPassword,
  });
  return response.data;
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}