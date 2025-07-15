import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PAGE_SIZE = 10;

const SlotManager = ({ iki_id: propIkiId }) => {
  const [slots, setSlots] = useState([]);
  const [cycle, setCycle] = useState(null);
  const [message, setMessage] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCycle, setLoadingCycle] = useState(false);
  const [user, setUser] = useState({ id: null, name: null });
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');

  // Read user info from localStorage
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

  const iki_id = propIkiId || user.id;

  const fetchSlots = async () => {
    if (!iki_id) return;
    setLoadingSlots(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/slotsManagementRoutes/${iki_id}`);
      setSlots(res.data);
      setPage(1); // reset page when new data arrives
    } catch {
      setMessage('Failed to fetch slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchCycle = async () => {
    if (!iki_id) return;
    setLoadingCycle(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/slotsManagementRoutes/metadata/${iki_id}`);
      setCycle(res.data || null);
    } catch {
      setMessage('Failed to fetch cycle info');
    } finally {
      setLoadingCycle(false);
    }
  };

  const handleGenerate = async () => {
    if (!iki_id) return;
    setMessage('Generating slots...');
    try {
      await axios.post(`http://localhost:5000/api/slotsManagementRoutes/generate/${iki_id}`);
      setMessage('Slots generated successfully');
      fetchCycle();
      fetchSlots();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to generate slots');
    }
  };

  const handleReset = async () => {
    if (!iki_id) return;
    if (!window.confirm('Are you sure you want to reset all slots?')) return;
    setMessage('Resetting slots...');
    try {
      await axios.put(`http://localhost:5000/api/slotsManagementRoutes/reset/${iki_id}`);
      setMessage('Slots reset successfully');
      fetchCycle();
      fetchSlots();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to reset slots');
    }
  };

  useEffect(() => {
    if (iki_id) {
      fetchCycle();
      fetchSlots();
    }
  }, [iki_id]);

  // Date today as YYYY-MM-DD string
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter slots by status
  const filteredSlots = slots.filter(slot => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'passed') return slot.slot_date < todayStr;
    if (filterStatus === 'future') return slot.slot_date >= todayStr;
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredSlots.length / PAGE_SIZE);
  const paginatedSlots = filteredSlots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Passed and remaining counts based on all slots
  const passedSlotsCount = slots.filter(slot => slot.slot_date < todayStr).length;
  const remainingSlotsCount = slots.length - passedSlotsCount;

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Manage Saving Slots</h2>

      {/* User info */}
      {user.name && user.id ? (
        <div className="mb-4 p-4 border rounded bg-gray-100 text-gray-800">
          <p>
            <strong>User:</strong> {user.name} (ID: {user.id})
          </p>
        </div>
      ) : (
        <p className="mb-4 text-red-500">User info not found in localStorage.</p>
      )}

      {/* Cycle info */}
      {loadingCycle ? (
        <p>Loading cycle info...</p>
      ) : cycle && cycle.cycle_start ? (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <p>
            <strong>Current Cycle:</strong> {new Date(cycle.cycle_start).toLocaleDateString()} —{' '}
            {new Date(cycle.cycle_end).toLocaleDateString()}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            {cycle.is_cycle_active ? (
              <span className="text-green-600 font-semibold">Active</span>
            ) : (
              <span className="text-gray-600">Inactive</span>
            )}
          </p>
          <p>
            <strong>Total Slots:</strong> {cycle.total_slots}
          </p>
          <p>
            <strong>Slots Passed:</strong> {passedSlotsCount}
          </p>
          <p>
            <strong>Slots Remaining:</strong> {remainingSlotsCount}
          </p>
        </div>
      ) : (
        <p>No active or past saving cycle found.</p>
      )}

      {/* Action buttons */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleGenerate}
          disabled={cycle?.is_cycle_active}
          className={`px-4 py-2 rounded text-white ${
            cycle?.is_cycle_active ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          Generate Slots
        </button>
        <button
          onClick={handleReset}
          disabled={!cycle?.is_cycle_active}
          className={`px-4 py-2 rounded text-white ${
            cycle?.is_cycle_active ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Reset Slots
        </button>
      </div>

      {/* Filter dropdown */}
      <div className="mb-4">
        <label htmlFor="filterStatus" className="mr-2 font-medium">
          Filter slots by status:
        </label>
        <select
          id="filterStatus"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1); // reset to page 1 on filter change
          }}
          className="border rounded px-2 py-1"
        >
          <option value="all">All</option>
          <option value="passed">Passed</option>
          <option value="future">Future</option>
        </select>
      </div>

      {/* Message */}
      {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}

      {/* Slots table */}
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
                const isPassed = slot.slot_date < todayStr;
                return (
                  <tr
                    key={slot.slot_id}
                    className={`border-b ${
                      isPassed ? 'bg-gray-100 text-gray-500' : ''
                    }`}
                  >
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

          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded ${
                page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
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
