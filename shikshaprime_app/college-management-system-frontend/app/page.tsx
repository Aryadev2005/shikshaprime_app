"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/src/context/authContext";

export default function LandingPage() {
  const { user } = useContext(AuthContext)!;
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
    } else {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, router]);

  return null;
}
