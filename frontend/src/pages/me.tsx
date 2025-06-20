import React, { useEffect, useState } from "react";
import { fetchFromAPI } from "../utils/communication";
import Navbar from "../components/Navbar";
import LogoutButton from "../components/LogoutButton";
import BackendState from "../components/BackendState";
import Info from "../components/Info";
import AnimatedLogo from "../components/AnimatedLogo";

interface User {
    username: string;
    email: string;
    verified: boolean;
}

const UserProfile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // Fetch user info if logged in
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await fetchFromAPI("/users/me");
                if (data.status === 200) {
                    const json = await data.json();
                    setUser(json);
                } else if (data.status === 204) {
                    setAlertMessage("You are not logged in. Redirecting to login...");
                }
            } catch (error) {
                setAlertMessage((error as Error).message);
            }
        };

        fetchUser();
    }, []);
    if (alertMessage) {
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return (
            <Info type="error" message="You are not logged in. Redirecting to login..." onClose={() => { }} />
        );
    }

    // Show loading if user data is not yet fetched
    if (!user) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-zinc-100 dark:bg-zinc-900">
                <AnimatedLogo size={200} />
                <p className="mt-4 text-zinc-900 dark:text-zinc-100">Loading...</p>
            </div>
        );
    }


    return (
        <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-900">
            <Navbar />
            <div className="flex flex-grow items-center justify-center px-4">
                <div className="w-full max-w-md bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg">
                    <h1 className="text-3xl font-semibold text-center text-zinc-900 dark:text-zinc-100 mb-4">
                        Profile
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 text-center">
                        Welcome, {user.username}!
                    </p>

                    {/* Profile Info */}
                    <div className="mt-6 space-y-4">
                        <div className="flex justify-between border-b border-zinc-300 dark:border-zinc-600 pb-2">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Username:</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{user.username}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-300 dark:border-zinc-600 pb-2">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Email:</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Verified:</span>
                            <span className={`${user.verified ? "text-emerald-500" : "text-sky-600"} font-medium`}>
                                {user.verified ? "Yes" : "No"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Button Centered */}
            <div className="flex flex-grow justify-center items-center">
                <LogoutButton />
            </div>

            <BackendState />

        </div>
    );
};

export default UserProfile;
