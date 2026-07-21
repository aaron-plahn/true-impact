import { JSX, useEffect, useState } from "react";
import { config } from "../../config";
import { Loading } from "../loading";

type UserInfo = {};

type ErrorInfo = {
  code: number;
  message: string;
};

type HasMessage = {
  message: string;
};

const hasMessage = (input: unknown): input is HasMessage =>
  typeof (input as HasMessage)?.message === "string";

export const UserProfile = (): JSX.Element => {
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (userInfo !== null) {
      return;
    }

    try {
      fetch(new URL(`${config.API_URL}/sessioninfo`).toString()).then(
        async (response) => {
          const body = await response.json();

          if (!response.ok) {
            setErrorInfo({
              code: response.status,
              message: hasMessage(body) ? body.message : JSON.stringify(body),
            });
          } else {
            setUserInfo(body);

            setIsLoading(false);
          }
        },
      );

      setIsLoading(true);
    } catch (error) {
      setErrorInfo({
        code: 500,
        message: hasMessage(error)
          ? error.message
          : "Unknown client exception.",
      });
    }
  }, [userInfo]);

  if (errorInfo !== null) {
    // TODO Error info presenter
    return <div>Error!</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  /**
   * This is not exactly what we want to do. This is just a placeholder for now. Remove this soon
   * in favour of hitting a `who-am-i` endpoint.
   */
  return <div>{JSON.stringify(userInfo)}</div>;
};
