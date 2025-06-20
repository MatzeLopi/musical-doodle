import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { fetchFromAPI } from '../utils/communication';
import Navbar from '../components/Navbar';
import BackendState from '../components/BackendState';
import { useAuth } from '../contexts/AuthContext';
import Info from '../components/Info';

const Registration: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setMail] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { isLoggedIn } = useAuth();


    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {


            if (!(await fetchFromAPI('/users/available/username', { method: 'POST', body: JSON.stringify({ payload: username }) }, "application/json")).ok) {

                throw new Error('Username already taken');
            }

            if (!(await fetchFromAPI('/users/available/email', { method: 'POST', body: JSON.stringify({ payload: email }) }, "application/json")).ok) {
                throw new Error('Email already taken');
            }



            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    password: password,
                    email: email,
                    // Add other fields as necessary
                }),
            });

            if (response.status != 201) {
                throw new Error(response.statusText);
            }

            console.log('Registration successful:');
            setTimeout(() => {
                const redirectUrl = sessionStorage.getItem('redirectAfterRegistration') || '/';
                router.push(redirectUrl);
            }, 1500);
        } catch (err) {

            setError('Registration failed: ' + (err as Error).message);
        }
    };

    if (isLoggedIn) {
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
        return (
            <Info message="Already logged in. Redirecting to Home" onClose={() => { }} />
        );
    }


    return (
        <>
            <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-900">
                <Navbar />
                <div className="flex items-center justify-center m-auto">
                    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-100">Register</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username Field */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">Username:</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 mt-1 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">Password:</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 mt-1 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">E-Mail:</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setMail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 mt-1 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {/* Login Link */}
                            <div>
                                <p className="block text-sm text-center text-zinc-700 dark:text-zinc-300">
                                    If you already have an account{' '}
                                    <a href="/login" className="text-sky-600 hover:text-sky-500">
                                        Login
                                    </a>.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <Info type="error" message={error} onClose={() => setError("")} />
                            )}

                            {/* Register Button */}
                            <button
                                type="submit"
                                className="w-full px-4 py-2 text-white bg-sky-600 rounded-md hover:bg-sky-700  shadow-md  transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                            >
                                Register
                            </button>
                        </form>
                    </div>
                </div>


                <BackendState />
            </div>
        </>

    );
};

export default Registration;