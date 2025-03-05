import React, { useState, useEffect, useRef,useContext } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Alert from '../components/Alert';
import Info from '../components/Info';
import BackendState from '../components/BackendState';
import { fetchFromAPI } from '../utils/communication';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const [showAlert, setShowAlert] = useState(false);
    const {isLoggedIn, setIsLoggedIn} = useAuth();

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
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
            router.push(redirectUrl); // Redirect to the saved URL or homepage
        } catch (err) {
            setError('Login failed: ' + (err as Error).message);
        }
    };
    console.log(isLoggedIn);
    if (isLoggedIn) {
        setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        return (
            <>
                <div className="flex justify-center items-center min-h-screen">
                    <Info message="Already logged in. Redirecting to Home" onClose={() => { }} />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="flex flex-col min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex items-center justify-center m-auto">
                    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-center text-gray-900">Login</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username:</label>
                                <input
                                    type="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password:</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <p className="block text-sm text-center">
                                    <a href="/register" className="text-indigo-600 hover:text-indigo-800">
                                        Register
                                    </a> if you don`t have an account.{' '}

                                </p>
                            </div>
                            {error && <p className="text-sm text-center text-red-600">{error}</p>}
                            <button
                                type="submit"
                                className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Login
                            </button>
                        </form>
                    </div>
                </div>
                {showAlert && (
                    <Alert
                        message={error}
                        onClose={() => setShowAlert(false)}
                    />
                )}
            <BackendState />
            </div>
        </>
    );
};

export default Login;