import { createContext, useState, useContext, useEffect } from "react";
import { fetchFromAPI } from "../utils/communication"; // your API helper

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create a context with a default value that could be undefined.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const value = { isLoggedIn, setIsLoggedIn };

  useEffect(() => {
    async function checkLogin() {
      try {
       const response = await fetchFromAPI("/users/me");
        if (response.status ==200
        ) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        // token invalid or error occurred
        setIsLoggedIn(false);
      }
    }
    checkLogin();
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for easier usage of the auth context.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
