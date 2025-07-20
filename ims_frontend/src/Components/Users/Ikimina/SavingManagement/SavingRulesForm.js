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
  const [activeRound, setActiveRound] = useState(null);
  const [completedRounds, setCompletedRounds] = useState([]);
  const [upcomingRounds, setUpcomingRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');

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

  // Fetch Ikimina info
  const fetchIkiminaInfo = async () => {
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

  // Fetch rounds: active, completed, upcoming
  useEffect(() => {
    if (!iki_id || !headers.Authorization) return;

    fetchIkiminaInfo();

    const fetchRounds = async () => {
      try {
        // Active round
        const activeRes = await axios.get(
          `http://localhost:5000/api/savingRulesRoutes/activeRound/${iki_id}`,
          { headers }
        );
        const activeRoundData = activeRes.data.round || null;
        setActiveRound(activeRoundData);

        // Completed rounds
        let completedRoundsData = [];
        try {
          const completedRes = await axios.get(
            `http://localhost:5000/api/savingRulesRoutes/completedRounds/${iki_id}`,
            { headers }
          );
          completedRoundsData = completedRes.data;
        } catch (e) {
          completedRoundsData = [];
        }
        setCompletedRounds(completedRoundsData);

        // Upcoming rounds
        let upcomingRoundsData = [];
        try {
          const upcomingRes = await axios.get(
            `http://localhost:5000/api/savingRulesRoutes/upcomingRounds/${iki_id}`,
            { headers }
          );
          upcomingRoundsData = upcomingRes.data;
        } catch (e) {
          upcomingRoundsData = [];
        }
        setUpcomingRounds(upcomingRoundsData);

        // Set selected round id:
        // Priority: activeRound > first completed round > first upcoming round > ''
        if (activeRoundData?.round_id) {
          setSelectedRoundId(activeRoundData.round_id.toString());
        } else if (completedRoundsData.length > 0) {
          setSelectedRoundId(completedRoundsData[0].round_id.toString());
        } else if (upcomingRoundsData.length > 0) {
          setSelectedRoundId(upcomingRoundsData[0].round_id.toString());
        } else {
          setSelectedRoundId('');
          setRules({
            saving_ratio: '',
            time_delay_penalty: '',
            date_delay_penalty: '',
            time_limit_minutes: '',
          });
          setMessage('No rounds available.');
        }
      } catch (err) {
        setError('Failed to load rounds or rules.');
      }
    };

    fetchRounds();
  }, [iki_id, headers]);

  // Fetch rules when selected round changes
  useEffect(() => {
    if (!selectedRoundId) {
      // Clear form if no round selected
      setRules({
        saving_ratio: '',
        time_delay_penalty: '',
        date_delay_penalty: '',
        time_limit_minutes: '',
      });
      setMessage('');
      setError('');
      return;
    }

    const fetchRulesForRound = async () => {
      try {
        setLoading(true);
        setError('');
        setMessage('');
        const res = await axios.get(
          `http://localhost:5000/api/savingRulesRoutes/getRulesForSelectedRound/${iki_id}/${selectedRoundId}`,
          { headers }
        );
        setRules({
          saving_ratio: res.data.saving_ratio || '',
          time_delay_penalty: res.data.time_delay_penalty || '',
          date_delay_penalty: res.data.date_delay_penalty || '',
          time_limit_minutes: res.data.time_limit_minutes || '',
        });
        setMessage('Rules for selected round loaded.');
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
          setError('Failed to fetch rules.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRulesForRound();
  }, [selectedRoundId, iki_id, headers]);

  const handleIkiminaChange = (e) => {
    const roundId = e.target.value;
    setSelectedRoundId(roundId);
    setError('');
    setMessage('');
    if (roundId === '') {
      // Clear form immediately on no selection
      setRules({
        saving_ratio: '',
        time_delay_penalty: '',
        date_delay_penalty: '',
        time_limit_minutes: '',
      });
    }
  };

  const handleChange = (e) => {
    // Disable editing if active or completed round selected
    if (isFormDisabled) return;

    setRules({ ...rules, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    if (!selectedRoundId) {
      setError('Please select a round.');
      return;
    }

    if (isFormDisabled) {
      setError('Cannot edit rules for active or completed rounds.');
      return;
    }

    const payload = {
      iki_id,
      round_id: parseInt(selectedRoundId, 10),
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
      setError(err.response?.data?.message || 'Failed to save rules.');
    } finally {
      setLoading(false);
    }
  };

  // Disable form inputs if selected round is active or completed
  const isFormDisabled =
    (activeRound && activeRound.round_id.toString() === selectedRoundId) ||
    completedRounds.some((round) => round.round_id.toString() === selectedRoundId);

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
          onChange={handleIkiminaChange}
          disabled={loading}
        >
          <option value="">-- Select a round --</option>

          {activeRound && (
            <option value={activeRound.round_id}>
              Active Round - {activeRound.round_year} (
              {new Date(activeRound.start_date).toLocaleDateString()} -{' '}
              {new Date(activeRound.end_date).toLocaleDateString()})
            </option>
          )}

          {completedRounds.map((round) => (
            <option key={round.round_id} value={round.round_id}>
              Completed Round - {round.round_year} (
              {new Date(round.start_date).toLocaleDateString()} -{' '}
              {new Date(round.end_date).toLocaleDateString()})
            </option>
          ))}

          {upcomingRounds.map((round) => (
            <option key={round.round_id} value={round.round_id}>
              {round.round_year} (
              {new Date(round.start_date).toLocaleDateString()} -{' '}
              {new Date(round.end_date).toLocaleDateString()})
            </option>
          ))}
        </select>
        {!activeRound && completedRounds.length === 0 && upcomingRounds.length === 0 && (
          <p className="text-sm text-red-600 mt-1">No rounds available.</p>
        )}
      </div>

      {/* Rules summary display for selected round */}
      {selectedRoundId && (
        <div className="mb-4 p-4 bg-gray-50 border rounded text-gray-700">
          <h3 className="font-semibold mb-2">Current Rules for Selected Round:</h3>
          {rules.saving_ratio === '' ? (
            <p className="italic text-gray-500">No rules defined yet.</p>
          ) : (
            <ul className="list-disc list-inside">
              <li>
                <strong>Saving Ratio:</strong> {rules.saving_ratio}
              </li>
              <li>
                <strong>Time Delay Penalty:</strong> {rules.time_delay_penalty}
              </li>
              <li>
                <strong>Date Delay Penalty:</strong> {rules.date_delay_penalty}
              </li>
              <li>
                <strong>Time Limit (Minutes):</strong> {rules.time_limit_minutes}
              </li>
            </ul>
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
            value={rules.saving_ratio}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
            disabled={loading || isFormDisabled}
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
            disabled={loading || isFormDisabled}
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
            disabled={loading || isFormDisabled}
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
            disabled={loading || isFormDisabled}
          />
        </div>

        {!isFormDisabled && (
          <button
            type="submit"
            disabled={loading}
            className={`py-2 rounded text-white ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Saving...' : 'Save Rules'}
          </button>
        )}

        {isFormDisabled && (
          <p className="text-gray-600 italic mt-2">
            Rules for the active or completed round cannot be edited.
          </p>
        )}
      </form>
    </div>
  );
};

export default SavingRulesForm;
