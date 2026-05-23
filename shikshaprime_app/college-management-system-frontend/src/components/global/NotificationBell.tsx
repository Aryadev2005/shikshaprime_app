"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNotification, Notification, NotificationType } from "@/src/context/notificationContext";
import "./NotificationBell.css";

export default function NotificationBell() {
          const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotification();
          const [isOpen, setIsOpen] = useState(false);
          const dropdownRef = useRef<HTMLDivElement>(null);

          // Close dropdown when clicking outside
          useEffect(() => {
                    function handleClickOutside(event: MouseEvent) {
                              if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                                        setIsOpen(false);
                              }
                    }
                    document.addEventListener("mousedown", handleClickOutside);
                    return () => document.removeEventListener("mousedown", handleClickOutside);
          }, []);

          const getTypeIcon = (type: NotificationType) => {
                    switch (type) {
                              case "success":
                                        return "✓";
                              case "error":
                                        return "✕";
                              case "warning":
                                        return "⚠";
                              case "info":
                                        return "ℹ";
                    }
          };

          const getTypeColor = (type: NotificationType) => {
                    switch (type) {
                              case "success":
                                        return "notification-success";
                              case "error":
                                        return "notification-error";
                              case "warning":
                                        return "notification-warning";
                              case "info":
                                        return "notification-info";
                    }
          };

          const formatTime = (date: Date) => {
                    const now = new Date();
                    const diff = now.getTime() - date.getTime();
                    const minutes = Math.floor(diff / 60000);
                    const hours = Math.floor(diff / 3600000);
                    const days = Math.floor(diff / 86400000);

                    if (minutes < 1) return "Just now";
                    if (minutes < 60) return `${minutes}m ago`;
                    if (hours < 24) return `${hours}h ago`;
                    return `${days}d ago`;
          };

          const handleNotificationClick = (notification: Notification) => {
                    if (!notification.read) {
                              markAsRead(notification.id);
                    }
          };

          return (
                    <div className="notification-bell-container" ref={dropdownRef}>
                              <button
                                        className="notification-bell-button"
                                        onClick={() => setIsOpen(!isOpen)}
                                        aria-label="Notifications"
                              >
                                        <Bell className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                                  <span className="notification-badge">
                                                            {unreadCount > 99 ? "99+" : unreadCount}
                                                  </span>
                                        )}
                              </button>

                              {isOpen && (
                                        <div className="notification-dropdown">
                                                  <div className="notification-header">
                                                            <h3>Notifications</h3>
                                                            <div className="notification-actions">
                                                                      {unreadCount > 0 && (
                                                                                <button
                                                                                          onClick={markAllAsRead}
                                                                                          className="action-btn"
                                                                                          title="Mark all as read"
                                                                                >
                                                                                          <CheckCheck className="h-4 w-4" />
                                                                                </button>
                                                                      )}
                                                                      {notifications.length > 0 && (
                                                                                <button
                                                                                          onClick={clearAll}
                                                                                          className="action-btn"
                                                                                          title="Clear all"
                                                                                >
                                                                                          <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                      )}
                                                            </div>
                                                  </div>

                                                  <div className="notification-list">
                                                            {notifications.length === 0 ? (
                                                                      <div className="notification-empty">
                                                                                <Bell className="h-8 w-8 text-gray-300" />
                                                                                <p>No notifications yet</p>
                                                                      </div>
                                                            ) : (
                                                                      notifications.slice(0, 20).map((notification) => (
                                                                                <div
                                                                                          key={notification.id}
                                                                                          className={`notification-item ${getTypeColor(notification.type)} ${notification.read ? "read" : "unread"}`}
                                                                                          onClick={() => handleNotificationClick(notification)}
                                                                                >
                                                                                          <div className="notification-icon-wrapper">
                                                                                                    <span className={`notification-type-icon ${getTypeColor(notification.type)}`}>
                                                                                                              {getTypeIcon(notification.type)}
                                                                                                    </span>
                                                                                          </div>
                                                                                          <div className="notification-content">
                                                                                                    <div className="notification-title">{notification.title}</div>
                                                                                                    {notification.message && (
                                                                                                              <div className="notification-message">{notification.message}</div>
                                                                                                    )}
                                                                                                    <div className="notification-time">{formatTime(notification.timestamp)}</div>
                                                                                          </div>
                                                                                          <button
                                                                                                    className="notification-remove"
                                                                                                    onClick={(e) => {
                                                                                                              e.stopPropagation();
                                                                                                              removeNotification(notification.id);
                                                                                                    }}
                                                                                                    title="Remove"
                                                                                          >
                                                                                                    <X className="h-3 w-3" />
                                                                                          </button>
                                                                                </div>
                                                                      ))
                                                            )}
                                                  </div>
                                        </div>
                              )}
                    </div>
          );
}
