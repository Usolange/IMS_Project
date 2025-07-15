import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SavingRulesForm = ({ iki_id }) => {
  const [rules, setRules] = useState({
    saving_ratio: '',
    time_delay_penalty: '',
    date_delay_penalty: '',
    time_limit_minutes: '',
  });
  const [ikiminaInfo, setIkiminaInfo] = useState(null);
  const [cycleStatus, setCycleStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const headers = {
    Authorization: `Bearer ${token}`,
    'x-iki-id': user?.id,
  };

  useEffect(() => {
    if (!iki_id) return;
    setError('');
    setMessage('');
    fetchRules();
    fetchIkiminaInfo();
    fetchCycleStatus();
  }, [iki_id]);

  const fetchRules = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/penalityManagementRoutes/selectRules/${iki_id}`,
        { headers }
      );
      setRules(res.data);
    } catch {
      setMessage('No existing rules found.');
    }
  };

  const fetchIkiminaInfo = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/penalityManagementRoutes/ikiminaInfo/${iki_id}`,
        { headers }
      );
      setIkiminaInfo(res.data);
    } catch {
      setIkiminaInfo(null);
    }
  };

  const fetchCycleStatus = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/penalityManagementRoutes/cycleStatus/${iki_id}`,
        { headers }
      );
      setCycleStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch cycle status:', err);
    }
  };

  const handleStartCycle = async () => {
    setError('');
    setMessage('');
    try {
      const res = await axios.post(
        `http://localhost:5000/api/penalityManagementRoutes/startCycle/${iki_id}`,
        {},
        { headers }
      );
      setMessage(res.data.message);
      fetchCycleStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start new cycle.');
    }
  };

  const handleChange = (e) => {
    setRules({ ...rules, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      saving_ratio: parseFloat(rules.saving_ratio),
      time_delay_penalty: parseFloat(rules.time_delay_penalty),
      date_delay_penalty: parseFloat(rules.date_delay_penalty),
      time_limit_minutes: parseInt(rules.time_limit_minutes, 10),
    };

    if (Object.values(payload).some((v) => isNaN(v))) {
      return setError('Please enter valid numeric values in all fields.');
    }

    try {
      await axios.put(
        `http://localhost:5000/api/penalityManagementRoutes/newRules/${iki_id}`,
        payload,
        { headers }
      );
      setMessage('Saving rules updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to update saving rules. Please try again later.'
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-blue-700">Define Saving Rules</h2>
        {ikiminaInfo && (
          <p className="text-sm text-gray-600">
            <strong>Ikimina:</strong> {ikiminaInfo.iki_name}
          </p>
        )}
      </div>

      {cycleStatus && (
        <div className="border rounded p-4 bg-gray-50 mb-4">
          <h3 className="font-medium text-sm mb-2 text-gray-800">Current Cycle Status</h3>
          <p className="text-sm">
            <strong>Status:</strong>{' '}
            <span className={cycleStatus.active ? 'text-green-600' : 'text-red-600'}>
              {cycleStatus.status}
            </span>
          </p>
          <p className="text-sm">
            <strong>Round:</strong> {cycleStatus.round}
          </p>
          {cycleStatus.current && (
            <p className="text-sm">
              <strong>Started On:</strong>{' '}
              {new Date(cycleStatus.current.cycle_start).toLocaleString()}
            </p>
          )}
          {cycleStatus.lastEnded?.cycle_end && (
            <p className="text-sm text-gray-600">
              <strong>Last Ended:</strong>{' '}
              {new Date(cycleStatus.lastEnded.cycle_end).toLocaleString()}
            </p>
          )}
          {!cycleStatus.active && (
            <button
              onClick={handleStartCycle}
              className="mt-2 px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start New Cycle
            </button>
          )}
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <div>
          <label className="block mb-1 font-medium">Saving Ratio</label>
          <input
            type="number"
            step="0.01"
            name="saving_ratio"
            value={rules.saving_ratio || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Time Delay Penalty</label>
          <input
            type="number"
            step="0.01"
            name="time_delay_penalty"
            value={rules.time_delay_penalty || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Date Delay Penalty</label>
          <input
            type="number"
            step="0.01"
            name="date_delay_penalty"
            value={rules.date_delay_penalty || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Time Limit (Minutes)</label>
          <input
            type="number"
            name="time_limit_minutes"
            value={rules.time_limit_minutes || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
            min="0"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Save Rules
        </button>
      </form>
    </div>
  );
};

export default SavingRulesForm;
