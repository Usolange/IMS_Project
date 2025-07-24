import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SavingRulesForm = ({ iki_id: propIkiId }) => {
  const [rules, setRules] = useState({
    saving_ratio: '',
    time_delay_penalty: '',
    date_delay_penalty: '',
    time_limit_minutes: '',
    interest_rate_percent: '',
  });

  const [ikiminaInfo, setIkiminaInfo] = useState(null);
  const [upcomingRounds, setUpcomingRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedRoundStatus, setSelectedRoundStatus] = useState(''); // new state for status

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [headers, setHeaders] = useState({});

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
      } catch {}
    }
  }, []);

  const iki_id = propIkiId || user?.id;

  useEffect(() => {
    if (!iki_id || !headers.Authorization) return;

    fetchIkiminaInfo();
    fetchUpcomingRounds();
  }, [iki_id, headers]);

  // Fetch status when a round is selected
  useEffect(() => {
    if (!selectedRoundId) {
      setSelectedRoundStatus('');
      setRules({
        saving_ratio: '',
        time_delay_penalty: '',
        date_delay_penalty: '',
        time_limit_minutes: '',
        interest_rate_percent: '',
      });
      setMessage('');
      setError('');
      return;
    }

    // Find the selected round's status from upcomingRounds (or fetch separately if needed)
    // For upcomingRounds, if you have only upcoming rounds here, you may want to fetch all rounds including active/completed to find status.
    // But let's assume you have access to the round status in your rounds data (else, fetch from backend)

    // Example: Find round status from rounds list
    // You can keep a separate allRounds state if needed.

    // For demonstration, let's fetch round info from backend:
    fetchRoundInfo(selectedRoundId);

    fetchSavingRules(selectedRoundId);
  }, [selectedRoundId]);

  const fetchRoundInfo = async (roundId) => {
    try {
      // Assuming you have an endpoint to get round info by id and iki_id
      const res = await axios.get(
        `http://localhost:5000/api/savingRulesRoutes/roundInfo/${iki_id}/${roundId}`,
        { headers }
      );
      setSelectedRoundStatus(res.data.round_status); // e.g. 'upcoming', 'active', 'completed'
    } catch (err) {
      setSelectedRoundStatus('');
      console.error('Failed to fetch round info:', err);
    }
  };

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
        interest_rate_percent: res.data.interest_rate_percent ?? '',
      });
      setMessage('Loaded existing rules for this round.');
    } catch (err) {
      if (err.response?.status === 404) {
        setRules({
          saving_ratio: '',
          time_delay_penalty: '',
          date_delay_penalty: '',
          time_limit_minutes: '',
          interest_rate_percent: '',
        });
        setMessage('No existing rules for selected round.');
      } else {
        setError('Failed to fetch existing rules.');
      }
    }
  };

  const handleChange = (e) => {
    setRules({ ...rules, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!selectedRoundId) {
      setError('Please select a round to set saving rules for.');
      return;
    }

    // Disable submit if round status is not 'upcoming'
    if (selectedRoundStatus !== 'upcoming') {
      setError('You can only update rules for upcoming rounds.');
      return;
    }

    const payload = {
      iki_id,
      round_id: selectedRoundId,
      saving_ratio: parseFloat(rules.saving_ratio),
      time_delay_penalty: parseFloat(rules.time_delay_penalty),
      date_delay_penalty: parseFloat(rules.date_delay_penalty),
      time_limit_minutes: parseInt(rules.time_limit_minutes, 10),
      interest_rate_percent: parseFloat(rules.interest_rate_percent),
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

  // Disable form inputs if round status is not upcoming
  const isDisabled = selectedRoundStatus !== 'upcoming';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Define Saving Rules</h2>

      {ikiminaInfo && (
        <p className="text-sm text-gray-600 mb-2">
          <strong>Ikimina:</strong> {ikiminaInfo.iki_name}
        </p>
      )}

      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700">Select Round</label>
        <select
          className="w-full border border-gray-300 p-2 rounded"
          value={selectedRoundId}
          onChange={(e) => setSelectedRoundId(e.target.value)}
          required
          disabled={loading}
        >
          <option value="">-- Select a round --</option>
          {/* To show all rounds, not only upcoming, you can extend the rounds array or fetch all */}
          {upcomingRounds.map((round) => (
            <option key={round.round_id} value={round.round_id}>
              {round.round_year} | {new Date(round.start_date).toLocaleDateString()} -{' '}
              {new Date(round.end_date).toLocaleDateString()}
            </option>
          ))}
        </select>
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
            disabled={loading || isDisabled}
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
            disabled={loading || isDisabled}
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
            disabled={loading || isDisabled}
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
            disabled={loading || isDisabled}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Interest Rate (%)</label>
          <input
            type="number"
            step="0.01"
            name="interest_rate_percent"
            value={rules.interest_rate_percent}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
            min="0"
            disabled={loading || isDisabled}
          />
        </div>

        <button
          type="submit"
          disabled={loading || isDisabled}
          className={`py-2 rounded text-white ${
            loading || isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Saving...' : 'Save Rules'}
        </button>
      </form>
    </div>
  );
};

export default SavingRulesForm;
