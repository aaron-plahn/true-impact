import { JSX, useEffect, useState } from "react";
import { Loading } from "../Loading";
import { config } from "../../config/config.local";

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
      fetch(new URL(`${config.apiDomain}/sessioninfo`).toString()).then(
        async (response) => {
          const body = await response.json();

          console.log({ body });

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

  return <div>{JSON.stringify(userInfo)}</div>;
};
