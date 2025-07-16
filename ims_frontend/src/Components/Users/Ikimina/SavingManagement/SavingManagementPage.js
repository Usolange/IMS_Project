import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

const SavingManagementPage = () => {
  const [ikiId, setIkiId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.role === 'ikimina') {
      setIkiId(user.id);
    }
  }, []);

  if (!ikiId) {
    return <p>Loading user info...</p>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">Saving Management</h1>
      {/* We load child routes here */}
      <Outlet context={{ ikiId }} />
    </div>
  );
};

export default SavingManagementPage;
