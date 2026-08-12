import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getMe, login, type AdminUser } from "../api/authApi";

const ACCESS_TOKEN_KEY = "rentease_admin_access_token";
const REFRESH_TOKEN_KEY = "rentease_admin_refresh_token";

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (loginValue: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!token) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then((currentUser) => {
        if (currentUser.role !== "ADMIN") {
          signOut();
          return;
        }

        if (currentUser.isActive === false) {
          signOut();
          return;
        }

        setUser(currentUser);
      })
      .catch(() => {
        signOut();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [signOut]);

  const signIn = useCallback(
    async (loginValue: string, password: string) => {
      const response = await login(loginValue, password);

      const accessToken = response.data?.accessToken;
      const refreshToken = response.data?.refreshToken;

      if (!accessToken) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      // Get the authoritative user profile from /auth/me.
      const currentUser = await getMe();

      if (currentUser.role !== "ADMIN") {
        signOut();
        throw new Error("This account does not have administrator access.");
      }

      if (currentUser.isActive === false) {
        signOut();
        throw new Error("This administrator account is inactive.");
      }

      setUser(currentUser);
    },
    [signOut],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      signIn,
      signOut,
    }),
    [user, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }

  return context;
}
