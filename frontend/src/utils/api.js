import axios from "axios";

export const createApiClient = (token) => {
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  api.interceptors.response.use(
    (res) => res,
    (error) => {
      const message = error.response?.data?.message || error.message || "Something went wrong";
      return Promise.reject(new Error(message));
    }
  );

  return api;
};

export const createApiClientWithAuth = async (getToken) => {
  const token = getToken ? await getToken() : null;
  return createApiClient(token);
};
