import { createContext, ReactNode, useContext, useState } from "react";

interface AppCredentials {
  username: string;
  password: string;
}

interface UserSessionInfo {
  id: string;
  username: string;
}

interface AuthError {
  message: string;
}

export interface AuthContextData {
  user: UserSessionInfo | null;
  isLoading: boolean;
  error: AuthError | null;
  doesSessionExist: boolean;
  logIn: (credentials: AppCredentials, onSuccess?: () => void) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserSessionInfo | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<AuthError | null>(null);

  const doesSessionExist = user !== null;

  const logIn = async (
    credentials: { username: string; password: string },
    onSuccess?: () => void,
  ) => {
    // setIsLoading(true);


    // TODO can we refactor this? The try catch is really hard to follow. Throwing for control flow is confusing.
    try {
      const signInResponse = await fetch("http://localhost:3234/auth/logIn", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!signInResponse.ok) {
        throw new Error(`Invalid Credentials`);
      }

      const userProfileResponse = await fetch(
        "http://localhost:3234/auth/session",
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!userProfileResponse.ok) {
        throw new Error(`Failed to fetch user profile.`);
      }

      const userProfileData =
        (await userProfileResponse.json()) as UserSessionInfo;

      setUser(userProfileData);

      setIsLoading(false);

      if (typeof onSuccess === "function") {
        onSuccess();
      }
    } catch (e) {
      setError({
        message:
          (e as { message?: string }).message ||
          "An unknown authentication error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async () => {
    const logOutResponse = await fetch("http://localhost:3234/auth/logOut", {
      method: "POST",
      credentials: "include",
    });

    const _logOutData = await logOutResponse.json();

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        doesSessionExist,
        error,
        logIn,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
