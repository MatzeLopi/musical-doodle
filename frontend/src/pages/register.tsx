import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { fetchFromAPI } from '../utils/communication';
import Navbar from '../components/Navbar';
import BackendState from '../components/BackendState';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setMail] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const csrfFetched = useRef(false); // Prevent duplicate requests


    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {

            try {
                await fetchFromAPI('/users/available/username', { method: 'POST', body: JSON.stringify({ username: username }) })
            } catch (err) {
                throw new Error('Username already taken');
            }

            try {
                await fetchFromAPI('/users/available/email', { method: 'POST', body: JSON.stringify({ email: email }) })
            } catch (err) {
                throw new Error('Email already taken');
            }


            const response = await fetch('http://localhost:8080/users/create-user', {
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

            if (!(response.status != 201)) {
                throw new Error('Registration failed');
            }

            console.log('Registration successful:');
            const redirectUrl = sessionStorage.getItem('redirectAfterRegistration') || '/';
            router.push(redirectUrl);
        } catch (err) {

            setError('Registration failed: ' + (err as Error).message);
        }
    };

    return (
        <>
            <div className="flex flex-col min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex items-center justify-center m-auto">

                    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-center text-gray-900">Register</h2>
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
                                <label className="block text-sm font-medium text-gray-700">E-Mail:</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setMail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <p className="block text-sm text-center">
                                    If you already have an account {' '}
                                    <a href="/login" className="text-indigo-600 hover:text-indigo-800">
                                        Login
                                    </a>.

                                </p>
                            </div>
                            {error && <p className="text-sm text-center text-red-600">{error}</p>}
                            <button
                                type="submit"
                                className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

export default Login;