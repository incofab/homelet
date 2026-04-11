import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '../lib/api';

interface ApiQueryOptions<T, R> {
  enabled?: boolean;
  select?: (data: T) => R | null;
  deps?: unknown[];
}

export const useApiQuery = <T, R = T>(
  path: string | null,
  options: ApiQueryOptions<T, R> = {},
) => {
  const { enabled = true, select, deps = [] } = options;
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const selectRef = useRef(select);

  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  const fetchData = useCallback(async () => {
    if (!path || !enabled) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const result = await apiGet<T>(path, { signal: controller.signal });
      const mapped = selectRef.current
        ? selectRef.current(result)
        : (result as unknown as R);
      setData(mapped);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData, ...deps]);

  return { data, loading, error, refetch: fetchData };
};
