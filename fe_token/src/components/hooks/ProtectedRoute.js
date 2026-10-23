// src/ProtectedRoute.js
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
  

const ProtectedRoute = ({ children }) => { 
  const authcontext = useContext(AuthContext);

  return authcontext.isLoggedIn ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
