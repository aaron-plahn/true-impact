import { JSX } from "react";
import { Link } from "react-router-dom";

export const Home = (): JSX.Element => {
  return (
    <div className="App">
      <header className="App-header">
        <img
          src="/denisiqi-logo-transparent.png"
          className="App-logo"
          alt="logo"
        />
        True Impact
      </header>
      <Link to={"/users/current"}>Manage Users</Link>
      <br />
      <Link to={"/auth"}>Log In</Link>
    </div>
  );
};
