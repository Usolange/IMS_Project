import React, { useState, useEffect } from 'react';
import SavingRulesForm from './SavingRulesForm';
import SlotManager from './SlotManager';
import AdminSavingStats from './AdminSavingStats';
import SavingActivityLog from './SavingActivityLog';
import PenaltiesOverview from './PenaltiesOverview';
import RoundManagement from './RoundManagement'; // Import the new component

const SavingManagementPage = () => {
  const [view, setView] = useState('rules');
  const [ikiId, setIkiId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.role === 'ikimina') {
      setIkiId(user.id); // from login token
    }
  }, []);

  const renderView = () => {
    if (!ikiId) return <p>Loading user info...</p>;

    switch (view) {
      case 'rounds':
        return <RoundManagement iki_id={ikiId} />;
      case 'slots':
        return <SlotManager iki_id={ikiId} />;
      case 'stats':
        return <AdminSavingStats iki_id={ikiId} />;
      case 'activities':
        return <SavingActivityLog iki_id={ikiId} />;
      case 'penalties':
        return <PenaltiesOverview iki_id={ikiId} />;
      case 'rules':
        return <SavingRulesForm iki_id={ikiId} />;// Add the round management view
      default:
        return <RoundManagement iki_id={ikiId} />;
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">Saving Management</h1>
      <div className="flex flex-wrap gap-4 mb-6">
         <button
          className={`px-4 py-2 rounded ${view === 'rounds' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          onClick={() => setView('rounds')}
        >
          Manage Rounds
        </button>
        <button
          className={`px-4 py-2 rounded ${view === 'rules' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          onClick={() => setView('rules')}
        >
          Saving Rules
        </button>
        <button
          className={`px-4 py-2 rounded ${view === 'slots' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          onClick={() => setView('slots')}
        >
          Manage Slots
        </button>
        <button
          className={`px-4 py-2 rounded ${view === 'stats' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          onClick={() => setView('stats')}
        >
          Saving Statistics
        </button>
        <button
          className={`px-4 py-2 rounded ${view === 'activities' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          onClick={() => setView('activities')}
        >
          Saving Activities
        </button>
        <button
          className={`px-4 py-2 rounded ${view === 'penalties' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          onClick={() => setView('penalties')}
        >
          Penalties Overview
        </button>
       
      </div>

      {renderView()}
    </div>
  );
};

export default SavingManagementPage;
