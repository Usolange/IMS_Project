// Components/Auth/GuestOnlyRoute.js
import { useContext } from "react";
import { Auth } from "./Auth";
import { Navigate } from "react-router-dom";

const GuestOnlyRoute = ({ children }) => {
  const { user } = useContext(Auth);

  if (user) {
    // If logged in, redirect to dashboard or home
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestOnlyRoute;
