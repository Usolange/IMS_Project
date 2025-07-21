import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PAGE_SIZE = 50;

const SlotManager = ({ iki_id: propIkiId }) => {
  const [slots, setSlots] = useState([]);
  const [round, setRound] = useState(null);
  const [message, setMessage] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingRound, setLoadingRound] = useState(false);
  const [user, setUser] = useState({ id: null, name: null });
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [slotsExist, setSlotsExist] = useState(false);
  const [toastError, setToastError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          id: parsedUser.sad_id || parsedUser.id || null,
          name: parsedUser.name || parsedUser.iki_name || parsedUser.username || 'Unknown User',
        });
      } catch {
        setUser({ id: null, name: null });
      }
    }
  }, []);

  // Use propIkiId if passed, else fallback to user.id
  const iki_id = propIkiId || user.id;

  const fetchSlots = async () => {
    if (!iki_id) return;
    setLoadingSlots(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/slotsManagementRoutes/selectAllSlots/${iki_id}`);

      const formattedSlots = res.data
        .map(slot => ({
          ...slot,
          slot_time: slot.slot_time?.slice(0, 5) || '00:00',
        }))
        .filter((slot, index, self) =>
          index === self.findIndex(s => s.slot_id === slot.slot_id)
        ); // Deduplicate by slot_id

      setSlots(formattedSlots);
      setSlotsExist(formattedSlots.length > 0);
      setPage(1);
    } catch {
      setMessage('Failed to fetch slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchRound = async () => {
    if (!iki_id) return;
    setLoadingRound(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/slotsManagementRoutes/roundMetadata/${iki_id}`);
      setRound(res.data || null);
    } catch {
      setMessage('Failed to fetch round info');
    } finally {
      setLoadingRound(false);
    }
  };

  const handleGenerate = async () => {
    if (!iki_id) return;
    setMessage('Generating slots...');
    setToastError('');
    try {
      await axios.post(`http://localhost:5000/api/slotsManagementRoutes/newSlots/${iki_id}`);
      setMessage('Slots generated successfully');
      await fetchRound();
      await fetchSlots();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to generate slots';
      setMessage(errorMsg);
      setToastError(errorMsg);
      setTimeout(() => setToastError(''), 4000);
    }
  };

  const handleReset = async () => {
    if (!iki_id) return;
    if (!window.confirm('Are you sure you want to reset all slots?')) return;
    setMessage('Resetting slots...');
    try {
      const res = await axios.put(`http://localhost:5000/api/slotsManagementRoutes/reset/${iki_id}`);
      setMessage(res.data.message);
      await fetchRound();
      await fetchSlots();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to reset slots');
    }
  };

  useEffect(() => {
    if (iki_id) {
      fetchRound();
      fetchSlots();
    }
  }, [iki_id]);

  const filteredSlots = slots.filter(slot => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'passed') return slot.slot_status === 'passed';
    if (filterStatus === 'upcoming') return slot.slot_status === 'upcoming';
    if (filterStatus === 'current') return slot.slot_status === 'pending';
    return true;
  });

  const totalPages = Math.ceil(filteredSlots.length / PAGE_SIZE);
  const paginatedSlots = filteredSlots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const passedSlotsCount = slots.filter(slot => slot.slot_status === 'passed').length;
  const remainingSlotsCount = slots.length - passedSlotsCount;

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Manage Saving Slots</h2>

      {user.name && user.id ? (
        <div className="mb-4 p-4 border rounded bg-gray-100 text-gray-800">
          <p><strong>User:</strong> {user.name} (ID: {user.id})</p>
        </div>
      ) : (
        <p className="mb-4 text-red-500">User info not found in localStorage.</p>
      )}

      {loadingRound ? (
        <p>Loading round info...</p>
      ) : round && round.start_date ? (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <p>
            <strong>Current Round:</strong> {new Date(round.start_date).toLocaleDateString()} — {new Date(round.end_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            {round.round_status === 'active' ? (
              <span className="text-green-600 font-semibold">Active</span>
            ) : (
              <span className="text-gray-600 capitalize">{round.round_status}</span>
            )}
          </p>
          <p><strong>Total Slots:</strong> {round.total_slots}</p>
          <p><strong>Slots Passed:</strong> {passedSlotsCount}</p>
          <p><strong>Slots Remaining:</strong> {remainingSlotsCount}</p>
        </div>
      ) : (
        <p>No active or upcoming round found.</p>
      )}

      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleGenerate}
          disabled={slotsExist || loadingSlots || loadingRound}
          aria-label="Generate saving slots"
          className={`px-4 py-2 rounded text-white ${
            slotsExist || loadingSlots || loadingRound ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          Generate Slots
        </button>
        <button
          onClick={handleReset}
          disabled={round?.round_status !== 'active' || loadingSlots || loadingRound}
          aria-label="Reset saving slots"
          className={`px-4 py-2 rounded text-white ${
            round?.round_status === 'active' && !loadingSlots && !loadingRound
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Reset Slots
        </button>
        {toastError && (
          <div className="toast-error text-red-600 font-semibold ml-4" role="alert" aria-live="assertive">
            {toastError}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="filterStatus" className="mr-2 font-medium">Filter slots by status:</label>
        <select
          id="filterStatus"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="border rounded px-2 py-1"
          aria-label="Filter saving slots by status"
        >
          <option value="all">All</option>
          <option value="passed">Passed</option>
          <option value="upcoming">Upcoming</option>
          <option value="current">Current Saving Day</option>
        </select>
      </div>

      {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}

      {loadingSlots ? (
        <p>Loading slots...</p>
      ) : paginatedSlots.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Time</th>
                <th className="p-2 border">Category</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSlots.map((slot, i) => {
                const isPassed = slot.slot_status === 'passed';
                return (
                  <tr key={slot.slot_id} className={`border-b ${isPassed ? 'bg-gray-100 text-gray-500' : ''}`}>
                    <td className="p-2 border">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="p-2 border">{slot.slot_date}</td>
                    <td className="p-2 border">{slot.slot_time}</td>
                    <td className="p-2 border">{slot.frequency_category}</td>
                    <td className="p-2 border capitalize">{slot.slot_status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className={`px-3 py-1 rounded ${
                page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
              className={`px-3 py-1 rounded ${
                page === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <p>No slots available.</p>
      )}
    </div>
  );
};

export default SlotManager;
