const AnimatedLogo = ({ size = 50 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="45 40 110 130"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      strokeLinecap="round"
    >
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff416c" />
          <stop offset="100%" stopColor="#ff4b2b" />
        </linearGradient>
      </defs>

      {/* Main wave path */}
      <path
        d="M50 100 Q75 50, 100 100 T150 100"
        stroke="url(#grad)"
        strokeWidth="8"
        fill="none"
      >
        <animate
          attributeName="d"
          values="
            M50 100 Q75 50, 100 100 T150 100;
            M50 100 Q75 55, 100 100 T150 100;
            M50 100 Q75 50, 100 100 T150 100
          "
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>

      {/* Secondary wave path */}
      <path
        d="M60 110 Q85 60, 110 110 T140 110"
        stroke="url(#grad)"
        strokeWidth="6"
        fill="none"
      >
        <animate
          attributeName="d"
          values="
            M60 110 Q85 60, 110 110 T140 110;
            M60 110 Q85 65, 110 110 T140 110;
            M60 110 Q85 60, 110 110 T140 110
          "
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>

      {/* Central lip element with subtle animation */}
      <path
        d="M75 120 Q100 140, 125 120 Q100 130, 75 120 Z"
        fill="url(#grad)"
        stroke="#ff4b2b"
        strokeWidth="2"
      >
        <animate
          attributeName="d"
          values="
            M75 120 Q100 140, 125 120 Q100 130, 75 120 Z;
            M75 120 Q100 145, 125 120 Q100 135, 75 120 Z;
            M75 120 Q100 140, 125 120 Q100 130, 75 120 Z
          "
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
};

export default AnimatedLogo;
