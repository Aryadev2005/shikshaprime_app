"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/authContext";


export function useAuthGuard(shouldRedirect: boolean = true) {
  const { user, isInitialized } = useContext(AuthContext)!;
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    console.log(`useAuthGuard: shouldRedirect=${shouldRedirect}, hasUser=${!!user}`);
    if (shouldRedirect && !user) {
      router.replace("/auth/login");
    }
  }, [user, router, shouldRedirect, isInitialized]);

  return user;
}
