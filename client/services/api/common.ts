import { Transaction, Expense, Income, Saving, Revolving } from '../../types';

export const BASE_URL = "/api/v1";

export interface ResponseProps {
  data: Transaction[] | Expense[] | Income[] | Saving[] | Revolving[];
  page: number;
  total_count: number;
  has_more: boolean;
}

export const getHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

export const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
  options.credentials = 'include';
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  options.headers = headers;
  return fetch(url, options);
};

export async function handleResponse(response: Response) {
  if (response.status === 403) {
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    let serverPayload: any = null;
    try {
      const errorData = await response.json();
      serverPayload = errorData;
      errorMessage = errorData.goblinResponse || errorData.goblin_response || errorData.message || (errorData.details ? `${errorData.message || 'Error'}: ${errorData.details}` : null) || errorMessage;
    } catch (e) {
      // Body not JSON or empty
    }
    const err: any = new Error(errorMessage);
    if (serverPayload) {
      err.serverPayload = serverPayload;
    }
    throw err;
  }
  
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return {};
  }
}

export async function handleResponseAndGetData(response: Response) {
  const data = await handleResponse(response);
  return data.data;
}
