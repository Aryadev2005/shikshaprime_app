import { useState } from "react";
import { toast } from "sonner";

export function useApi<T>(apiFn: (...args: any[]) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const call = async (...args: Parameters<typeof apiFn>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args) as any;
      setData(result);
      console.log("Result =============>", result);
      
      // Show success toast with message
      if (result?.message) {
        toast.success(result.message);
      }
      
      return result;
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      
      // Show error toast
      toast.error(message);
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, call };
}
