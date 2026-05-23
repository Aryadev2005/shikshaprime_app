"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
          id: string;
          type: NotificationType;
          title: string;
          message: string;
          timestamp: Date;
          read: boolean;
}

interface NotificationContextType {
          notifications: Notification[];
          unreadCount: number;
          addNotification: (type: NotificationType, title: string, message: string) => void;
          removeNotification: (id: string) => void;
          markAsRead: (id: string) => void;
          markAllAsRead: () => void;
          clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
          const [notifications, setNotifications] = useState<Notification[]>([]);

          const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
                    const newNotification: Notification = {
                              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              type,
                              title,
                              message,
                              timestamp: new Date(),
                              read: false,
                    };
                    setNotifications((prev) => [newNotification, ...prev]);
          }, []);

          const removeNotification = useCallback((id: string) => {
                    setNotifications((prev) => prev.filter((n) => n.id !== id));
          }, []);

          const markAsRead = useCallback((id: string) => {
                    setNotifications((prev) =>
                              prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                    );
          }, []);

          const markAllAsRead = useCallback(() => {
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          }, []);

          const clearAll = useCallback(() => {
                    setNotifications([]);
          }, []);

          const unreadCount = notifications.filter((n) => !n.read).length;

          return (
                    <NotificationContext.Provider
                              value={{
                                        notifications,
                                        unreadCount,
                                        addNotification,
                                        removeNotification,
                                        markAsRead,
                                        markAllAsRead,
                                        clearAll,
                              }}
                    >
                              {children}
                    </NotificationContext.Provider>
          );
}

export function useNotification() {
          const context = useContext(NotificationContext);
          if (!context) {
                    throw new Error("useNotification must be used within NotificationProvider");
          }
          return context;
}

// Convenience functions for different notification types
export function useNotify() {
          const { addNotification } = useNotification();

          return {
                    success: (title: string, message: string = "") => addNotification("success", title, message),
                    error: (title: string, message: string = "") => addNotification("error", title, message),
                    warning: (title: string, message: string = "") => addNotification("warning", title, message),
                    info: (title: string, message: string = "") => addNotification("info", title, message),
          };
}
