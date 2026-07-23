import axiosClient from "./axiosClient";

export async function getProjects() {
  const response = await axiosClient.get("/api/projects");
  return response.data; // List of projects
}

export async function createProject(data) {
  const response = await axiosClient.post("/api/projects", data);
  return response.data; // Created project details
}

export async function deleteProjectApi(id) {
  const response = await axiosClient.delete(`/api/projects/${id}`);
  return response.data;
}
