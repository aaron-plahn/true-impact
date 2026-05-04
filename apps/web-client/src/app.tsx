import { BrowserRouter } from "react-router-dom";
import SuperTokens, { SuperTokensWrapper } from "supertokens-auth-react";
import "./App.css";
import { getSupertokensConfig } from "./config";
import { AppRoutes } from "./routes";
import { NavBar } from "./components/navbar";

if (typeof window !== "undefined") {
  SuperTokens.init(getSupertokensConfig());
}

function App() {
  return (
    <SuperTokensWrapper>
      <BrowserRouter>
      <NavBar></NavBar>
        <AppRoutes />
      </BrowserRouter>
    </SuperTokensWrapper>
  );
}

export default App;
