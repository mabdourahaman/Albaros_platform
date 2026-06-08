import api from "./api";

export async function getCourses() {
  const response = await api.get("/courses");
  return response.data;
}

export async function getCourseById(id) {
  const response = await api.get(`/courses/${id}`);
  return response.data;
}