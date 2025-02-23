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
                <div className="fixed bottom-5 right-5 bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-md opacity-60 max-w-xs md:max-w-sm">
                    <p className="font-medium">
                        Cannot reach the server. <br />
                        Please try again later.
                    </p>
                </div>
            )}
        </>
    );
};

export default ServerStatus;
