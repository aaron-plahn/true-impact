import { useParams } from "react-router-dom";
import { JSX } from "react/jsx-runtime";

export const ClientDetailPage = (): JSX.Element => {
  const { id } = useParams();

  return (
    <div>
      <h1>Client</h1>
      <p>{id}</p>
    </div>
  );
};
