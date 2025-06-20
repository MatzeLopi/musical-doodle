import React, { useState, useEffect } from 'react';
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
            setTimeout(() => {
                window.location.href = '/';
            }, 1500); // Redirect after a delay to show success message
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Hide alerts automatically after 3 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    return (
        <div className="relative">
            <button
                onClick={handleLogout}
                className="px-4 py-2 sm:px-6 sm:py-3 text-white bg-sky-600 rounded-lg shadow-md hover:bg-sky-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
                disabled={loading}
            >
                {loading ? 'Logging out...' : 'Logout'}
            </button>

            {/* Success Alert */}
            {success && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="bg-emerald-600 text-white p-6 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{success}</span>
                    </div>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="bg-sky-600 text-white p-6 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Smooth Fade-in Animation */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default LogoutButton;
