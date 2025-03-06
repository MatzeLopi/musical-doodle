import { useState } from "react"; // import state
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
    const [isNavOpen, setIsNavOpen] = useState(false); // initiate isNavOpen state with false
    const { isLoggedIn } = useAuth();

    return (
        <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 py-8 px-4">
            <a href="/">
                <svg className="w-12 h-12" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round">
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ff416c" />
                            <stop offset="100%" stop-color="#ff4b2b" />
                        </linearGradient>
                    </defs>

                    <path d="M50 100 Q75 50, 100 100 T150 100" stroke="url(#grad)" stroke-width="8" fill="none" />
                    <path d="M60 110 Q85 60, 110 110 T140 110" stroke="url(#grad)" stroke-width="6" fill="none" />

                    <path d="M75 120 Q100 140, 125 120 Q100 130, 75 120 Z" fill="url(#grad)" stroke="#ff4b2b" stroke-width="2" />
                </svg>

            </a>
            <nav>
                {/* Mobile Menu */}
                <section className="MOBILE-MENU flex lg:hidden">
                    <div
                        className="HAMBURGER-ICON space-y-2"
                        onClick={() => setIsNavOpen((prev) => !prev)}
                    >
                        <span className="block h-0.5 w-8 bg-zinc-900 dark:bg-zinc-100"></span>
                        <span className="block h-0.5 w-8 bg-zinc-900 dark:bg-zinc-100"></span>
                        <span className="block h-0.5 w-8 bg-zinc-900 dark:bg-zinc-100"></span>
                    </div>

                    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-300 
${isNavOpen ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" : "hidden"}`}>


                        <div
                            className="absolute top-4 right-4 p-2"
                            onClick={() => setIsNavOpen(false)}
                        >
                            <svg
                                className="h-8 w-8 text-zinc-900 dark:text-zinc-100"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </div>

                        <ul className="flex flex-col items-center space-y-6 text-lg font-medium">
                            <li>
                                <a href="/" className="hover:text-purple-500">Feed</a>
                            </li>
                            <li>
                                <a href="/search" className="hover:text-purple-500">Search</a>
                            </li>
                            {!isLoggedIn && (
                                <li>
                                    <a href="/login" className="hover:text-purple-500">Login</a>
                                </li>
                            )}
                            {!isLoggedIn && (
                                <li>
                                    <a href="/register" className="hover:text-purple-500">Register</a>
                                </li>
                            )}
                            {isLoggedIn && (
                                <li>
                                    <a href="/file" className="hover:text-purple-500">Upload</a>
                                </li>
                            )}
                            {isLoggedIn && (
                                <li>
                                    <a href="/me" className="hover:text-purple-500">Me</a>
                                </li>
                            )}
                        </ul>
                    </div>
                </section>

                {/* Desktop Menu */}
                <ul className="DESKTOP-MENU hidden space-x-8 lg:flex uppercase text-zinc-900 dark:text-zinc-100">
                    <li>
                        <a href="/" className="hover:text-purple-500">Feed</a>
                    </li>
                    <li>
                        <a href="/search" className="hover:text-purple-500">Search</a>
                    </li>
                    {!isLoggedIn && (
                        <li>
                            <a href="/login" className="hover:text-purple-500">Login</a>
                        </li>
                    )}
                    {!isLoggedIn && (
                        <li>
                            <a href="/register" className="hover:text-purple-500">Register</a>
                        </li>
                    )}
                    {isLoggedIn && (
                        <li>
                            <a href="/file" className="hover:text-purple-500">Upload</a>
                        </li>
                    )}
                    {isLoggedIn && (
                        <li>
                            <a href="/me" className="hover:text-purple-500">Me</a>
                        </li>
                    )}
                </ul>
            </nav>
        </div>


    );
}