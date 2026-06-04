import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosHeaderValue,
} from 'axios';
import logger from '../../utils/logger';
import { ApiError } from '../../utils/api-error';

interface ApiClientOptions {
  name: string;
  baseURL: string;
  timeout?: number;
}

export interface ApiClientMethods {
  request(
    token: string | undefined,
    tenant: string,
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse>;
}

export const createApiClient = (options: ApiClientOptions): ApiClientMethods => {
  const { name, baseURL, timeout = 10000 } = options;

  const instance: AxiosInstance = axios.create({
    baseURL,
    timeout,
  });

  // Request interceptor - log requests
  instance.interceptors.request.use((config) => {
    logger.debug(
      { method: config.method?.toUpperCase(), url: config.url },
      `[${name}] Request initiated`,
    );
    return config;
  });

  // Response interceptor - normalize errors
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const statusCode = error.response?.status || 500;
      const message =
        (error.response?.data as any)?.message ||
        error.message ||
        'Upstream service error';

      logger.error(
        {
          statusCode,
          service: name,
          originalError: error.message,
        },
        `[${name}] Response error`,
      );

      throw new ApiError(statusCode, message);
    },
  );

  return {
    request(
      token: string | undefined,
      tenant: string,
      config: AxiosRequestConfig,
    ): Promise<AxiosResponse> {
      const headers: Record<string, AxiosHeaderValue> = {
        'x-tenant': tenant,
        ...config.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return instance.request({
        ...config,
        headers,
      });
    },
  };
};
