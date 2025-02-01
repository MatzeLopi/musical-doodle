import React, { useState } from 'react';
import { fetchFromAPI } from '../utils/communication';

const LogoutButton = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleLogout = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetchFromAPI("/logout");
            if (!response.ok) {
                throw new Error('Logout failed');
            }
            setSuccess('Successfully logged out!');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOnClick = () => {
        handleLogout();
    };

    // Function to hide the alert after a delay
    const hideAlert = () => {
        setTimeout(() => {
            setSuccess(null);
            setError(null);
        }, 3000); // Hides after 3 seconds
    };

    // Call hideAlert whenever success or error is set
    if (success || error) {
        hideAlert();
    }

    return (
        <div className="relative">
            <button
                onClick={handleOnClick}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300 sm:px-6 sm:py-3"
                disabled={loading}
            >
                {loading ? 'Logging out...' : 'Logout'}
            </button>

            {/* Success Alert */}
            {success && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="bg-green-100 text-green-700 p-6 rounded-lg shadow-md flex items-center space-x-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>{success}</span>
                    </div>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="bg-red-100 text-red-700 p-6 rounded-lg shadow-md flex items-center space-x-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogoutButton;
