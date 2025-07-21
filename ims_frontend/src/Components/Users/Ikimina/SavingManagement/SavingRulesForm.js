import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SavingRulesForm = ({ iki_id: propIkiId }) => {
  const [rules, setRules] = useState({
    saving_ratio: '',
    time_delay_penalty: '',
    date_delay_penalty: '',
    time_limit_minutes: '',
  });

  const [ikiminaInfo, setIkiminaInfo] = useState(null);
  const [upcomingRounds, setUpcomingRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auth info
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [headers, setHeaders] = useState({});

  // Load user and token once
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setHeaders({
          Authorization: `Bearer ${storedToken}`,
          'x-iki-id': parsedUser.id,
        });
      } catch {
        // silent fail
      }
    }
  }, []);

  // Determine iki_id from prop or user info
  const iki_id = propIkiId || user?.id;

  // Fetch ikimina info and rounds when iki_id and headers ready
  useEffect(() => {
    if (!iki_id || !headers.Authorization) return;

    fetchIkiminaInfo();
    fetchUpcomingRounds();
  }, [iki_id, headers]);

  // Fetch rules when round selected
  useEffect(() => {
    if (selectedRoundId) {
      fetchSavingRules(selectedRoundId);
    } else {
      // Clear form if no round selected
      setRules({
        saving_ratio: '',
        time_delay_penalty: '',
        date_delay_penalty: '',
        time_limit_minutes: '',
      });
      setMessage('');
      setError('');
    }
  }, [selectedRoundId]);

  // Fetch Ikimina Info
  const fetchIkiminaInfo = async () => {
    setError('');
    setMessage('');
    try {
      const res = await axios.get(
        `http://localhost:5000/api/savingRulesRoutes/ikiminaInfo/${iki_id}`,
        { headers }
      );
      setIkiminaInfo(res.data);
    } catch (err) {
      setIkiminaInfo(null);
      setError('Failed to load Ikimina information.');
    }
  };

  // Fetch Upcoming Rounds
  const fetchUpcomingRounds = async () => {
    setError('');
    setMessage('');
    try {
      const res = await axios.get(
        `http://localhost:5000/api/savingRulesRoutes/upcomingRounds/${iki_id}`,
        { headers }
      );
      setUpcomingRounds(res.data);
      if (res.data.length === 1) {
        setSelectedRoundId(res.data[0].round_id);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No upcoming rounds are scheduled.');
      } else {
        setError('Error retrieving upcoming rounds.');
      }
    }
  };

  // Fetch rules for selected round to prefill form
  const fetchSavingRules = async (roundId) => {
    setError('');
    setMessage('');
    try {
      const res = await axios.get(
        `http://localhost:5000/api/savingRulesRoutes/getRulesForSelectedRound/${iki_id}/${roundId}`,
        { headers }
      );
      setRules({
        saving_ratio: res.data.saving_ratio,
        time_delay_penalty: res.data.time_delay_penalty,
        date_delay_penalty: res.data.date_delay_penalty,
        time_limit_minutes: res.data.time_limit_minutes,
      });
      setMessage('Loaded existing rules for this round.');
    } catch (err) {
      if (err.response?.status === 404) {
        setRules({
          saving_ratio: '',
          time_delay_penalty: '',
          date_delay_penalty: '',
          time_limit_minutes: '',
        });
        setMessage('No existing rules for selected round.');
      } else {
        setError('Failed to fetch existing rules.');
      }
    }
  };

  // Form input change handler
  const handleChange = (e) => {
    setRules({ ...rules, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!selectedRoundId) {
      setError('Please select a round to set saving rules for.');
      return;
    }

    const payload = {
      iki_id,
      round_id: selectedRoundId,
      saving_ratio: parseFloat(rules.saving_ratio),
      time_delay_penalty: parseFloat(rules.time_delay_penalty),
      date_delay_penalty: parseFloat(rules.date_delay_penalty),
      time_limit_minutes: parseInt(rules.time_limit_minutes, 10),
    };

    if (Object.values(payload).some((v) => v === '' || isNaN(v))) {
      setError('All fields must be filled with valid numbers.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.put(
        `http://localhost:5000/api/savingRulesRoutes/newRules/${iki_id}`,
        payload,
        { headers }
      );
      setMessage('Saving rules saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred while saving rules.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Define Saving Rules</h2>

      {ikiminaInfo && (
        <p className="text-sm text-gray-600 mb-2">
          <strong>Ikimina:</strong> {ikiminaInfo.iki_name}
        </p>
      )}

      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700">Select Upcoming Round</label>
        <select
          className="w-full border border-gray-300 p-2 rounded"
          value={selectedRoundId}
          onChange={(e) => setSelectedRoundId(e.target.value)}
          required
          disabled={loading}
        >
          <option value="">-- Select a round --</option>
          {upcomingRounds.map((round) => (
            <option key={round.round_id} value={round.round_id}>
              {round.round_year} | {new Date(round.start_date).toLocaleDateString()} -{'  '}
              {new Date(round.end_date).toLocaleDateString()}
            </option>
          ))}
        </select>
        {upcomingRounds.length === 0 && (
          <p className="text-sm text-red-600 mt-1">No upcoming rounds found.</p>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <div>
          <label className="block mb-1 font-medium">Saving Ratio</label>
          <input
            type="number"
            step="0.01"
            name="saving_ratio"
            value={rules.saving_ratio}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Time Delay Penalty</label>
          <input
            type="number"
            step="0.01"
            name="time_delay_penalty"
            value={rules.time_delay_penalty}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Date Delay Penalty</label>
          <input
            type="number"
            step="0.01"
            name="date_delay_penalty"
            value={rules.date_delay_penalty}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Time Limit (Minutes)</label>
          <input
            type="number"
            name="time_limit_minutes"
            value={rules.time_limit_minutes}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
            min="0"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`py-2 rounded text-white ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Saving...' : 'Save Rules'}
        </button>
      </form>
    </div>
  );
};

export default SavingRulesForm;
