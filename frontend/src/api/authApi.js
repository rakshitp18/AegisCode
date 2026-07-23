import axiosClient from "./axiosClient";

export async function loginRequest(email, password) {
  const response = await axiosClient.post("/api/auth/login", {
    email,
    password,
  });
  return response.data; // Should return { token: "..." }
}

export async function registerRequest(name, email, password) {
  const response = await axiosClient.post("/api/auth/register", {
    name,
    email,
    password,
  });
  return response.data; // Should return UserResponse DTO
}
