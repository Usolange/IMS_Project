import React, { useState } from 'react';
import Register from './Register'; // Import your Register component
import Login from './Login'; // Import your Login component

export default function AuthPage() {
  // State to track whether to show the login or register form
  const [isLogin, setIsLogin] = useState(false);

  // Function to switch to the login form
  const switchToLogin = () => {
    setIsLogin(true); // Switch to the login form
  };

  // Function to switch to the register form
  const switchToRegister = () => {
    setIsLogin(false); // Switch to the register form
  };

  return (
    <div className="auth-container">
      {isLogin ? (
        // Render Login form if isLogin is true
        <Login switchToRegister={switchToRegister} />
      ) : (
        // Render Register form if isLogin is false
        <Register switchToLogin={switchToLogin} />
      )}
    </div>
  );
}
