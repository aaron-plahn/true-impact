import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { config } from "../config";

interface AppCredentials {
  username: string;
  password: string;
}

export interface UserSessionInfo {
  id: string;
  username: string;
  fullName: { firstName: string; middleNames: string[]; lastName: string };
  role: string;
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

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const checkForSession = async () => {
      try {
        const userProfileResponse = await fetch(
          `${config.API_URL}/users/who-am-i`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const userProfileResponseData = await userProfileResponse.json();

        if (!userProfileResponse.ok) {
          setUser(null);

          return;
        }

        setUser(userProfileResponseData);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkForSession();
  }, []);

  const doesSessionExist = user !== null;

  const logIn = async (
    credentials: { username: string; password: string },
    onSuccess?: () => void,
  ) => {
    // setIsLoading(true);

    // TODO can we refactor this? The try catch is really hard to follow. Throwing for control flow is confusing.
    try {
      const signInResponse = await fetch(`${config.API_URL}/auth/signin`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        /**
         * This is Supertoken's API. In the future, we should wrap this in the
         * back-end in favor of a more natural `{username: string, password: string}` DTO structure.
         */
        body: JSON.stringify({
          formFields: [
            {
              id: "email",
              value: credentials.username,
            },
            {
              id: "password",
              value: credentials.password,
            },
          ],
        }),
      });

      if (!signInResponse.ok) {
        throw new Error(`Invalid Credentials`);
      }

      const userProfileResponse = await fetch(
        `${config.API_URL}/users/who-am-i`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const userProfileResponseData =
        (await userProfileResponse.json()) as UserSessionInfo;

      if (!userProfileResponse.ok) {
        throw new Error(`Failed to fetch user profile.`);
      }

      setUser(userProfileResponseData);

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
    await fetch(`${config.API_URL}/auth/signout`, {
      method: "POST",
      credentials: "include",
    });

    // TODO store the response and check if it is an error and handle this appropriately

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
