import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Info from '../components/Info';
import BackendState from '../components/BackendState';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { isLoggedIn, setIsLoggedIn } = useAuth();
    const [justLoggedIn, setJustLoggedIn] = useState(false);
    

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {


            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/get`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies in the request
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            // Handle successful login
            setIsLoggedIn(true);
            setJustLoggedIn(true);
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } catch (err) {
            setError('Login failed: ' + (err as Error).message);
        }
    };

    if (isLoggedIn && !justLoggedIn) {
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    } 

    return (
        <> 
        
            <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-900">
                <Navbar />
                <div className="flex items-center justify-center m-auto">
                    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-100">Login</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username Field */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Username:
                                </label>
                                <input
                                    type="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 mt-1 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Password:
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 mt-1 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {/* Register Link */}
                            <div>
                                <p className="block text-sm text-center text-zinc-700 dark:text-zinc-300">
                                    <a href="/register" className="text-purple-500 hover:text-purple-600">
                                        Register
                                    </a>{' '}
                                    if you don’t have an account.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && <p className="text-sm text-center text-rose-600">{error}</p>}

                            {/* Login Button */}
                            <button
                                type="submit"
                                className="w-full px-4 py-2 text-white bg-rose-600 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                            >
                                Login
                            </button>
                        </form>
                    </div>
                </div>
                <BackendState />

            </div>
            {/* Alert */}
            {justLoggedIn && (
                <Info type = "success" message="Login successful. Redirecting to Home" onClose={() => { }} />
            )}
            {
            (isLoggedIn && !justLoggedIn) &&(
                <Info type='info' message="Already logged in. Redirecting to Home" onClose={() => { }} />    
            )}
            {error && (
                <Info type='error' message={error} onClose={() => setError('')}/>
            )}


        </>

    );
};

export default Login;