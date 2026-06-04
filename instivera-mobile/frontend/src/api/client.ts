import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000/api/mobile';

interface RefreshQueueItem {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: RefreshQueueItem[] = [];

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.instance.interceptors.request.use(async (config) => {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const tenant = await SecureStore.getItemAsync('tenant');

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      if (tenant) {
        config.headers['x-tenant'] = tenant;
      }

      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;

            try {
              // Note: implement refresh endpoint based on identity service
              // For now, we'll clear auth and redirect to login
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('tenant');

              this.isRefreshing = false;
              this.refreshQueue.forEach((item) => {
                item.reject(new Error('Token refresh failed'));
              });
              this.refreshQueue = [];

              throw error;
            } catch (err) {
              this.isRefreshing = false;
              this.refreshQueue.forEach((item) => {
                item.reject(err as Error);
              });
              this.refreshQueue = [];

              throw error;
            }
          }

          return new Promise((resolve, reject) => {
            this.refreshQueue.push({
              resolve: (token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.instance(originalRequest));
              },
              reject,
            });
          });
        }

        throw error;
      },
    );
  }

  public getClient(): AxiosInstance {
    return this.instance;
  }
}

export const apiClient = new ApiClient();
