export type ApiResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function readApiResult<T = unknown>(response: Response): Promise<ApiResult<T>> {
  const text = await response.text();

  if (!text.trim()) {
    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  }

  try {
    const result = JSON.parse(text) as ApiResult<T>;
    return {
      ...result,
      success: Boolean(result.success) && response.ok,
      error: result.error || (!response.ok ? `HTTP ${response.status}` : undefined),
    };
  } catch {
    return {
      success: false,
      error: 'Response API tidak valid.',
    };
  }
}

export async function apiRequest<T = unknown>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(url, init);
  return readApiResult<T>(response);
}
