import { useRouter } from 'next/router';

const LoginButton = () => {
    const router = useRouter();

    const handleLoginClick = () => {
        // Store the current URL in sessionStorage
        sessionStorage.setItem('redirectAfterLogin', router.asPath);
        router.push('/login');
    };

    return (
        <button
            onClick={handleLoginClick}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300 sm:px-6 sm:py-3"
        >
            Login
        </button>
    );
};

export default LoginButton;