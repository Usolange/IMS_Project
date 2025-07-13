import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SavingManager = () => {
  // Load logged-in user info from localStorage (per your login response)
  const user = JSON.parse(localStorage.getItem('user'));

  const [savings, setSavings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newSaving, setNewSaving] = useState({ amount: '', date: '' });

  useEffect(() => {
    if (!user?.member_id) return;
    fetchSavings();
  }, [user]);

  // Fetch savings for logged-in user
  const fetchSavings = async () => {
    try {
      const res = await axios.get(
        `/api/savingInfoRoutes/getSavingsHistory/${user.member_id}`
      );
      setSavings(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error('Error fetching savings:', err);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value.toLowerCase();
    setSearchTerm(val);
    const filteredList = savings.filter((s) =>
      s.iki_name.toLowerCase().includes(val)
    );
    setFiltered(filteredList);
  };

  const handleAddSaving = async (e) => {
    e.preventDefault();
    const { amount, date } = newSaving;

    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!date) {
      alert('Please select a date.');
      return;
    }

    try {
      await axios.post('/api/savingInfoRoutes/saveMoney', {
        iki_id: user.iki_id,    // Automatically from logged-in user
        amount,
        date,
        member_id: user.member_id,
      });
      alert('Saving added successfully!');
      setShowModal(false);
      setNewSaving({ amount: '', date: '' });
      fetchSavings();
    } catch (err) {
      console.error(err);
      alert('Failed to add saving.');
    }
  };

  return (
    <div className="saving-manager-container p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        💰 Savings for {user?.member_names || 'Member'}
      </h2>

      <button
        onClick={() => setShowModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
      >
        Add Saving
      </button>

      <input
        type="text"
        placeholder="Search by Ikimina group..."
        value={searchTerm}
        onChange={handleSearch}
        className="p-2 border rounded w-64 mb-6"
      />

      <div className="overflow-x-auto border rounded shadow">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-center">#</th>
              <th className="p-2 border text-left">Ikimina Group</th>
              <th className="p-2 border text-right">Amount (RWF)</th>
              <th className="p-2 border text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((entry, idx) => (
                <tr
                  key={entry.saving_id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="p-2 border text-center">{idx + 1}</td>
                  <td className="p-2 border">{entry.iki_name}</td>
                  <td className="p-2 border text-right">{entry.amount}</td>
                  <td className="p-2 border">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="p-4 text-center text-gray-500 italic"
                >
                  No savings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Saving Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 max-w-full">
            <h3 className="text-xl font-semibold mb-4">
              Add New Saving for {user?.member_names}
            </h3>
            <form onSubmit={handleAddSaving}>
              <label className="block mb-1 font-medium">Amount (RWF)</label>
              <input
                type="number"
                min="1"
                value={newSaving.amount}
                onChange={(e) =>
                  setNewSaving({ ...newSaving, amount: e.target.value })
                }
                className="mb-4 p-2 border w-full"
                required
              />

              <label className="block mb-1 font-medium">Date</label>
              <input
                type="date"
                value={newSaving.date || ''}
                onChange={(e) =>
                  setNewSaving({ ...newSaving, date: e.target.value })
                }
                className="mb-6 p-2 border w-full"
                required
              />

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingManager;
