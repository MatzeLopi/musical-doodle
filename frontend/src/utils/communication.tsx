export async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
    const csrfToken = getCookie('x_csft') || ''; // Default to an empty string if undefined

    // Ensure the default options are correctly merged
    const defaultOptions: RequestInit = {
        credentials: 'include', // This is to include cookies with the request
        headers: {
            'Content-Type': 'application/json',
            'x_csft': csrfToken, // Now csrfToken is always a string
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, defaultOptions);

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
