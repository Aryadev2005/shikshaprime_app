"use client";
import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../services/authService";
import logger from "../utils/logger";

export type Role = string;
export type KnownRole = "student" | "teacher" | "admin" | "offline";

interface User {
  role: Role;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  user_id: string;
  user_type: string;
  user_code: string; // This is the actual unique user ID from identity service
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isInitialized: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

let logoutFn: (() => void) | null = null;
export function getLogoutFn() { return logoutFn; }

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const { user: loggedInUser, token: jwtToken } = await loginUser(credentials);
      setUser(loggedInUser);
      setToken(jwtToken);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      localStorage.setItem("token", jwtToken);
      router.replace(`/dashboard/${loggedInUser.role}`);
    } catch (err) {
      if (err instanceof Error) {
        console.error("AuthContext login failed:", err.message);
      } else {
        console.error("Unknown error:", err);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.replace("/auth/login");
  };

  logoutFn = logout;

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setIsInitialized(true);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isInitialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
