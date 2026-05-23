"use client";
import { useEffect, useState } from "react";

export function useTenant() {
  const [tenant, setTenant] = useState<string>("");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)tenant=([^;]+)/);
    if (match) {
      setTenant(match[1]);
    }
  }, []);

  return tenant;
}
