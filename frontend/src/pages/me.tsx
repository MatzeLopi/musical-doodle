import React, { useEffect, useState } from 'react';
import { fetchFromAPI } from '../utils/communication';
import Navbar from '../components/Navbar';
import LogoutButton from '../components/LogoutButton';
import Info from '../components/Info';
import Alert from '../components/Alert';
import BackendState from '../components/BackendState';

interface User {
    username: string;
    email: string;
    verified: boolean;
}

const UserProfile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // Fetch user data when the component mounts
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await fetchFromAPI('/users/me');

                if (data.status == 204) {
                    setAlertMessage('Not logged in. Redirecting to login...');
                    setTimeout(() => {
                        window.location.href = '/login';
                      }, 3000);
                      return;
                }

                let json = await data.json();
                setUser(json);
            } catch (error) {
                setError((error as Error).message);
            }
        };

        fetchUser();
    }, []);

    if (error) {
        return (
            <>
                <Navbar />
                <div className="text-center text-red-500">
                    <p>Error: {error}</p>
                </div>
            </>
        );
    }
    if (alertMessage) {
        return (
            <>
                <div className="flex justify-center items-center min-h-screen">
                    <Alert message={alertMessage} onClose={() => { }} />
                </div>
            </>
        );
    } else if (!user) {
        return (
            <>
                <div className="flex justify-center items-center min-h-screen">
                    <p>Loading...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="flex flex-col min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex flex-grow items-center justify-center px-4">
                    <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
                        <h1 className="text-3xl font-semibold text-center text-gray-900 mb-4">Profile</h1>
                        <p className="text-lg text-gray-600 text-center">Welcome, {user.username}!</p>
                        <div className="mt-6 space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-600">Username:</span>
                                <span className="text-gray-800">{user.username}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-gray-600">Email:</span>
                                <span className="text-gray-800">{user.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Verified:</span>
                                <span
                                    className={`${user.verified ? "text-green-600" : "text-red-600"
                                        } font-medium`}
                                >
                                    {user.verified ? "Yes" : "No"}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
                <div className="flex flex-grow justify-center items-center ">
                    <LogoutButton />
                </div>
                <BackendState />

            </div>
        </>
    );
};

export default UserProfile;
