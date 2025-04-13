import { useRouter } from 'next/navigation';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for sending cookies
    });
    
    // If we get redirected to login page, we'll get HTML instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      window.location.href = '/login';
      throw new Error('Unauthorized - Redirecting to login');
    }

    // Always try to parse the JSON response first
    const data = await response.json();

    // Handle 401 unauthorized
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized - Redirecting to login');
    }
    
    // If the response is not ok but we have an error message from the API, use that
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    // If it's already an Error instance, just rethrow it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap it in an Error
    throw new Error('An unexpected error occurred');
  }
} 