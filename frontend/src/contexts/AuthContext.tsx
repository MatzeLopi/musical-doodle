import { createContext, useState, useContext, useEffect } from "react";
import { fetchFromAPI } from "../utils/communication";

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    async function checkLogin() {
      try {
        const response = await fetchFromAPI("/users/me");

        if (response.status === 200) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        clearTimeout(timeout); // Prevent timeout from triggering if request finishes
        setLoading(false);
      }
    }

    checkLogin();

    // Set timeout to prevent infinite loading
    timeout = setTimeout(() => {
      console.warn("Authentication check timed out.");
      setLoading(false); // Stop loading state after X seconds
    }, 5000); // Adjust timeout duration as needed (e.g., 5000ms = 5 seconds)

    return () => clearTimeout(timeout); // Cleanup timeout on unmount
  }, []);

  return <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loading }}>{children}</AuthContext.Provider>;
}

// Custom hook for easier usage of the auth context.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
