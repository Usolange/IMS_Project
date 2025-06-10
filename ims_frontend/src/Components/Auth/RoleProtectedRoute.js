// RoleProtectedRoute.js
import { useContext } from "react";
import { Auth } from "./Auth";
import Unauthorized from "./Unauthorized";

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(Auth);

  if (!user) {
    // User not logged in: maybe redirect to login or show unauthorized page
    return <Unauthorized />;
  }

  if (!allowedRoles.includes(user.role)) {
    // User logged in but role not allowed
    return <Unauthorized />;
  }

  return children;
};

export default RoleProtectedRoute;
