// TODO: Add SSL certificate pinning before production release.
// Use react-native-ssl-pinning or expo-modules for this.
// The production certificate SHA-256 fingerprint must be hardcoded here
// to prevent MITM attacks. Example:
//   fetch(url, { sslPinning: { certs: ['cert_fingerprint'] } })
// Do NOT ship to App Store / Play Store without this.

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { API_URL } from '../config/env';

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
        const status = error.response?.status;

        // 429 — server-side rate limit hit
        if (status === 429) {
          Alert.alert(
            'Too Many Requests',
            'You have made too many requests. Please wait a moment and try again.',
          );
          throw error;
        }

        // 403 — forbidden / insufficient permissions
        if (status === 403) {
          Alert.alert('Access Denied', 'You do not have permission to perform this action.');
          throw error;
        }

        // 401 — unauthorised: clear credentials and let the caller handle navigation
        if (status === 401 && originalRequest) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;

            try {
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
