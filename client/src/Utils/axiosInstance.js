import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://greenmart-server.vercel.app",
  withCredentials: true,
});

let navigate = null;
let logoutFunction = null;

export const setAxiosNavigate = (navigateFunction) => {
  navigate = navigateFunction;
};

export const setAxiosLogout = (logout) => {
  logoutFunction = logout;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      (error.response?.data?.code === "TOKEN_EXPIRED" ||
        error.response?.data?.code === "TOKEN_MISSING")
    ) {
      originalRequest._retry = true;

      try {
        await axiosInstance.get("/api/auth/refresh-token");

        return axiosInstance(originalRequest);
      } catch (error) {
        console.log(error.response?.data?.error);

        if (logoutFunction) {
          logoutFunction();
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
