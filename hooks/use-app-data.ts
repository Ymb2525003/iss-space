"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchBootstrap } from "@/lib/api";
import type { AppData } from "@/types";

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchBootstrap();
      setData(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    refresh,
  };
}
