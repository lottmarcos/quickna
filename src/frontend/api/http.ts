/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestInit } from 'next/dist/server/web/spec-extension/request';

export interface HttpClientRequestOptions extends RequestInit {
  timeout?: number;
  transformResponse?: (data: any) => any;
}

export interface HttpClientResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: HttpClientRequestOptions;
  url: string;
}

export class HttpClientError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
  url?: string;
  config?: HttpClientRequestOptions;

  constructor(message: string, response?: HttpClientResponse) {
    super(message);
    this.name = 'HttpClientError';

    if (response) {
      this.status = response.status;
      this.statusText = response.statusText;
      this.data = response.data;
      this.url = response.url;
      this.config = response.config;
    }
  }
}

const defaultConfig: HttpClientRequestOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
};

async function request<T = any>(
  url: string,
  options: HttpClientRequestOptions = {}
): Promise<HttpClientResponse<T>> {
  const config = { ...defaultConfig, ...options };
  const { timeout, transformResponse, ...fetchOptions } = config;

  let timeoutId;

  try {
    const fetchPromise = fetch(url, fetchOptions);

    const timeoutPromise = new Promise<never>((_, reject) => {
      if (timeout) {
        timeoutId = setTimeout(() => {
          reject(
            new HttpClientError(`Timeout de ${timeout}ms excedido`, {
              status: 408,
              statusText: 'Request Timeout',
              config,
              url,
            } as HttpClientResponse)
          );
        }, timeout);
      }
    });

    const response = (await Promise.race([
      fetchPromise,
      timeoutPromise,
    ])) as Response;

    if (timeoutId) clearTimeout(timeoutId);

    let data: any = null;
    const contentType = response.headers.get('content-type');

    if (contentType) {
      if (contentType.includes('application/json')) {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } else if (contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }
    }

    if (transformResponse) {
      data = transformResponse(data);
    }

    const clientResponse: HttpClientResponse<T> = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config,
      url,
    };

    if (!response.ok) {
      throw new HttpClientError(
        `Requisição falhou com status ${response.status}`,
        clientResponse
      );
    }

    return clientResponse;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    if (error instanceof HttpClientError) {
      throw error;
    }

    throw new HttpClientError(
      error instanceof Error ? error.message : String(error)
    );
  }
}

export const http = {
  /**
   * Fazer uma requisição GET
   */
  async get<T = any>(
    url: string,
    options?: HttpClientRequestOptions
  ): Promise<T> {
    const response = await request<T>(url, { ...options, method: 'GET' });
    return response.data;
  },

  /**
   * Fazer uma requisição POST
   */
  async post<T = any>(
    url: string,
    data?: any,
    options?: HttpClientRequestOptions
  ): Promise<T> {
    const body = data ? JSON.stringify(data) : undefined;
    const response = await request<T>(url, {
      ...options,
      method: 'POST',
      body,
    });
    return response.data;
  },

  /**
   * Fazer uma requisição PUT
   */
  async put<T = any>(
    url: string,
    data?: any,
    options?: HttpClientRequestOptions
  ): Promise<T> {
    const body = data ? JSON.stringify(data) : undefined;
    const response = await request<T>(url, { ...options, method: 'PUT', body });
    return response.data;
  },

  /**
   * Fazer uma requisição PATCH
   */
  async patch<T = any>(
    url: string,
    data?: any,
    options?: HttpClientRequestOptions
  ): Promise<T> {
    const body = data ? JSON.stringify(data) : undefined;
    const response = await request<T>(url, {
      ...options,
      method: 'PATCH',
      body,
    });
    return response.data;
  },

  /**
   * Fazer uma requisição DELETE
   */
  async delete<T = any>(
    url: string,
    options?: HttpClientRequestOptions
  ): Promise<T> {
    const response = await request<T>(url, { ...options, method: 'DELETE' });
    return response.data;
  },

  /**
   * Fazer uma requisição com método personalizado
   */
  async request<T = any>(
    options: HttpClientRequestOptions & { url: string }
  ): Promise<T> {
    const { url, ...config } = options;
    const response = await request<T>(url, config);
    return response.data;
  },
};
