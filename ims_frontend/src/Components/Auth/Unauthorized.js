// Components/Auth/Unauthorized.js
import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>🚫 Unauthorized Access</h2>
      <p>You do not have permission to view this page.</p>
      <Link to="/">Go to Home / Login</Link>
    </div>
  );
};

export default Unauthorized;
