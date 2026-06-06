import api from "./api";

// Old LoginPage compatibility
export async function loginUser(data) {
  const response = await api.post("/auth/login", data);
  return response.data;
}

// Old RegisterPage compatibility
export async function registerUser(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

// Navbar compatibility
export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// New StudentLoginPage
export async function loginStudent(data) {
  const response = await api.post("/auth/login", data);
  return response.data;
}

// New Teacher/Admin LoginPage
// Backend route will be added later
export async function loginStaff(data) {
  const response = await api.post("/auth/staff-login", data);
  return response.data;
}

// New name for student register
export async function registerStudent(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}