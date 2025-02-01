import React, { useEffect, useState } from 'react';
import { fetchFromAPI } from '../utils/communication';

interface User {
    username: string;
    email: string;
    verified: boolean;
}

const UserProfile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch user data when the component mounts
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await fetchFromAPI('/users/me'); // Replace with actual API endpoint
                setUser(await data.json());
            } catch (error) {
                setError((error as Error).message); // Casting to handle the error properly
            }
        };

        fetchUser(); // Call the fetchUser function
    }, []); // Empty dependency array ensures this runs once on mount

    if (error) {
        return (
            <div className="text-center text-red-500">
                <p>Error: {error}</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <div className="text-center">
                <h1 className="text-3xl font-semibold mb-4">Profile</h1>
                <p className="text-lg text-gray-600">Welcome, {user.username}!</p>
            </div>
            <div className="mt-6">
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Username:</span>
                        <span className="text-gray-800">{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Email:</span>
                        <span className="text-gray-800">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Verified:</span>
                        <span className="text-gray-800">{user.verified ? 'Yes' : 'No'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
