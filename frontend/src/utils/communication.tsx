const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function fetchFromAPI(
    endpoint: string,
    options: RequestInit = {},
    contentType: null | string = null,
) {
    const csrfToken = getCookie("x_csft") || ""; // Get CSRF token

    // Ensure headers object exists
    const headers: HeadersInit = new Headers(options.headers || {});

    headers.set("x_csft", csrfToken); // Add CSRF token

    // If it's not a multipart request, set JSON content type
    if (contentType != null) {
        headers.set("Content-Type", contentType);
    }

    const defaultOptions: RequestInit = {
        credentials: "include", // Include cookies in requests
        headers,
        ...options,
    };

    console.debug(`Sending request to ${BASE_URL}${endpoint}`, defaultOptions);

    // Fetch API request
    const response = await fetch(`${BASE_URL}${endpoint}`, defaultOptions);

    return response;
}

// Updated `getCookie` function with proper decoding
export function getCookie(name: string): string {
    const cookies = Object.fromEntries(
        document.cookie.split(';').map((cookie) => {
            const [key, value] = cookie.trim().split('=');
            return [key, value ? decodeURIComponent(value) : ''];
        })
    );
    return cookies[name] || ''; // Return an empty string if the cookie doesn't exist
}
