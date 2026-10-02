import type { ApiErrorBody } from '@/lib/types'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const err = (body as ApiErrorBody | null)?.error
    throw new ApiError(err?.message ?? `Request failed (${res.status})`, res.status, err?.code ?? 'unknown', err?.details)
  }
  return body as T
}

export const fetcher = <T,>(url: string) => apiFetch<T>(url)
