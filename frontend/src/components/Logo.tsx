const Logo = ({ size = 50 }) => {

    return (
        <svg width={size} height={size} viewBox="45 40 110 130" xmlns="http://www.w3.org/2000/svg" fill="none" strokeLinecap="round">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#048f2e" />
                </linearGradient>
            </defs>

            <path d="M50 100 Q75 50, 100 100 T150 100" stroke="url(#grad)" strokeWidth="8" fill="none" />
            <path d="M60 110 Q85 60, 110 110 T140 110" stroke="url(#grad)" strokeWidth="6" fill="none" />

            <path d="M75 120 Q100 140, 125 120 Q100 130, 75 120 Z" fill="url(#grad)" stroke="#0ea5e9" strokeWidth="0" />
        </svg>
    )

};

export default Logo;