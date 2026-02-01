// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
console.log(API_BASE_URL)

// API Endpoints
export const API_ENDPOINTS = {
  // Attendance endpoints
  attendances: '/attendances/',
  attendance: (id: string) => `/attendances/${id}/`,
  
  // Employee endpoints
  employees: '/employees/',
  employee: (id: string) => `/employees/${id}/`,
  
  // Department endpoints
  departments: '/departments/',
  department: (id: string) => `/departments/${id}/`,
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// API request helper with common configuration
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  // Only throw for server errors (5xx), not client errors (4xx)
  // This allows form handlers to process validation errors from 4xx responses
  if (!response.ok && response.status >= 500) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
};
