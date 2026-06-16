import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
let refreshSubscribers: ((token: string) => void)[] = [];
let isRefreshing = false;
let onLogoutCallback: (() => void) | null = null;
let onTokenRefreshedCallback: ((token: string) => void) | null = null;

export const setLocalAccessToken = (token: string | null) => {
  accessToken = token;
};

export const registerLogoutHandler = (callback: () => void) => {
  onLogoutCallback = callback;
};

export const registerTokenRefreshedHandler = (callback: (token: string) => void) => {
  onTokenRefreshedCallback = callback;
};

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true, // Crucial for HttpOnly Refresh Token Cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Token Refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Check if error is 401 and it's not a refresh/login request already
    const isAuthPath = originalRequest.url?.includes('/auth/google') || originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !isAuthPath) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Request new Access Token using HttpOnly Refresh Cookie
          const refreshResponse = await axios.post<{ accessToken: string }>(
            `${axiosInstance.defaults.baseURL}/api/v1/auth/refresh`,
            {},
            { withCredentials: true }
          );

          const newAccessToken = refreshResponse.data.accessToken;
          setLocalAccessToken(newAccessToken);
          
          if (onTokenRefreshedCallback) {
            onTokenRefreshedCallback(newAccessToken);
          }

          onRefreshed(newAccessToken);
          isRefreshing = false;

          // Retry the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          logOutUser();
          return Promise.reject(refreshError);
        }
      }

      // If already refreshing, queue the request until finished
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

function logOutUser() {
  setLocalAccessToken(null);
  if (onLogoutCallback) {
    onLogoutCallback();
  }
}
