import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./auth";
import { NavBar } from "./components/navbar";
import { AppRoutes } from "./routes";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar></NavBar>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
