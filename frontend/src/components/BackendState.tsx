import React, { useState, useEffect } from 'react';
import { fetchFromAPI } from '../utils/communication';

const ServerStatus = () => {
    const [isAvailable, setAvailable] = useState(true);

    // Check server availability periodically
    const checkState = async () => {
        try {
            await fetchFromAPI('/');
            setAvailable(true);
        } catch (error) {
            setAvailable(false); // If the request fails, set availability to false
        }
    };

    // Periodic check of the server availability every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            checkState();
        }, 5000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* Conditionally render the popup when the server is down */}
            {!isAvailable && (
                <div className="fixed bottom-5 right-5 bg-sky-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg opacity-80 hover:opacity-100 transition-all max-w-xs md:max-w-sm animate-slide-up">
                    <p className="font-semibold">
                        Cannot reach the server. <br />
                        Please try again later.
                    </p>
                </div>
            )}

            {/* Animation for smooth appearance */}
            <style>{`
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slideUp 0.3s ease-out;
        }
    `}</style>
        </>

    );
};

export default ServerStatus;
