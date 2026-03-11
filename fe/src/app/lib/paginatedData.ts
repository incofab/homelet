type LaravelPaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};

type LaravelPagination<T> = {
  current_page?: number;
  data?: T[];
  first_page_url?: string | null;
  from?: number | null;
  last_page?: number;
  last_page_url?: string | null;
  links?: LaravelPaginationLink[];
  next_page_url?: string | null;
  path?: string;
  per_page?: number;
  prev_page_url?: string | null;
  to?: number | null;
  total?: number;
};

const getNumber = (value: unknown) => (typeof value === "number" ? value : undefined);

const resolveKey = (raw: unknown, key?: string) => {
  if (!key || !raw || typeof raw !== "object") return raw;
  const record = raw as Record<string, unknown>;
  return key in record ? record[key] : raw;
};

export const extractRecord = <T,>(raw: unknown, key?: string): T | null => {
  if (!raw) return null;
  if (key && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (key in record) return record[key] as T;
  }
  return raw as T;
};

export class PaginatedData<T> {
  items: T[];
  currentPage?: number;
  lastPage?: number;
  perPage?: number;
  total?: number;
  nextPageUrl?: string | null;
  prevPageUrl?: string | null;
  links?: LaravelPaginationLink[];

  constructor(items: T[] = []) {
    this.items = items;
  }

  static from<T>(raw: unknown, key?: string) {
    const resolved = resolveKey(raw, key);
    if (Array.isArray(resolved)) {
      return new PaginatedData<T>(resolved as T[]);
    }

    if (resolved && typeof resolved === "object") {
      const record = resolved as LaravelPagination<T>;
      if (Array.isArray(record.data)) {
        const instance = new PaginatedData<T>(record.data);
        instance.currentPage = getNumber(record.current_page);
        instance.lastPage = getNumber(record.last_page);
        instance.perPage = getNumber(record.per_page);
        instance.total = getNumber(record.total);
        instance.nextPageUrl = record.next_page_url ?? null;
        instance.prevPageUrl = record.prev_page_url ?? null;
        instance.links = record.links;
        return instance;
      }
    }

    return new PaginatedData<T>([]);
  }
}
