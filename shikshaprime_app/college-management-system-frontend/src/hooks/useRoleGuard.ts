"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/authContext";

type KnownRole = "student" | "teacher" | "admin";

function isKnownRole(role: string): role is KnownRole {
  return ["student", "teacher", "admin"].includes(role);
}

export default function useRoleGuard(requiredRole: KnownRole) {
  const { user } = useContext(AuthContext)!;
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      // Not logged in → go to login
      router.replace("/auth/login");
    } else if (!isKnownRole(user.role)) {
      // Unknown role → fallback
      console.warn("Unknown role:", user.role);
      router.replace("/dashboard"); // safe default
    } else if (user.role !== requiredRole) {
      // Wrong role → redirect to their own dashboard
      switch (user.role) {
        case "student":
          router.replace("/dashboard/student");
          break;
        case "teacher":
          router.replace("/dashboard/teacher");
          break;
        case "admin":
          router.replace("/dashboard/admin");
          break;
        default:
          router.replace("/dashboard");
      }
    }
  }, [user, requiredRole, router]);

  return user; // return user so components can use it
}
