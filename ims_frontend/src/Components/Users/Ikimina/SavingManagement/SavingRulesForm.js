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
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedRoundStatus, setSelectedRoundStatus] = useState('');

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
    fetchAllRounds();
  }, [iki_id, headers]);

  useEffect(() => {
    if (!selectedRoundId) {
      setSelectedRoundStatus('');
      resetForm();
      setMessage('');
      setError('');
      return;
    }

    fetchRoundStatus(selectedRoundId);
    fetchSavingRules(selectedRoundId);
  }, [selectedRoundId]);

  const resetForm = () => {
    setRules({
      saving_ratio: '',
      time_delay_penalty: '',
      date_delay_penalty: '',
      time_limit_minutes: '',
      interest_rate_percent: '',
    });
  };

  const fetchIkiminaInfo = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/savingRulesRoutes/ikiminaInfo/${iki_id}`,
        { headers }
      );
      setIkiminaInfo(res.data);
    } catch {
      setIkiminaInfo(null);
      setError('Failed to load Ikimina information.');
    }
  };

  const fetchAllRounds = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/savingRulesRoutes/rounds/forikimina/${iki_id}`,
        { headers }
      );
      setRounds(res.data);
      if (res.data.length === 1) {
        setSelectedRoundId(res.data[0].round_id);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No rounds available.');
      } else {
        setError('Error retrieving rounds.');
      }
    }
  };

  const fetchRoundStatus = async (roundId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/savingRulesRoutes/roundInfo/${iki_id}/${roundId}`,
        { headers }
      );
      setSelectedRoundStatus(res.data.round_status?.toLowerCase()); // Normalize to lowercase
    } catch {
      setSelectedRoundStatus('');
    }
  };

  const fetchSavingRules = async (roundId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/savingRulesRoutes/getRulesForSelectedRound/${iki_id}/${roundId}`,
        { headers }
      );

      if (Object.keys(res.data).length === 0) {
        resetForm();
        setMessage('No existing rules for this round.');
        return;
      }

      setRules({
        saving_ratio: res.data.saving_ratio,
        time_delay_penalty: res.data.time_delay_penalty,
        date_delay_penalty: res.data.date_delay_penalty,
        time_limit_minutes: res.data.time_limit_minutes,
        interest_rate_percent: res.data.interest_rate_percent ?? '',
      });
      setMessage('Loaded existing rules for this round.');
    } catch (err) {
      setError('Failed to fetch existing rules.');
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
      setError('Please select a round.');
      return;
    }

    if (selectedRoundStatus === 'active' || selectedRoundStatus === 'completed') {
      setError('Editing is allowed only for upcoming rounds.');
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
      setError(err.response?.data?.message || 'An error occurred while saving rules.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    selectedRoundStatus === 'completed' || selectedRoundStatus === 'active';

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
          {rounds.map((round) => (
            <option key={round.round_id} value={round.round_id}>
              {round.round_year} | Round {round.round_number} ({round.round_status})
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 mt-4">
        {[
          { label: 'Saving Ratio', name: 'saving_ratio' },
          { label: 'Time Delay Penalty', name: 'time_delay_penalty' },
          { label: 'Date Delay Penalty', name: 'date_delay_penalty' },
          { label: 'Time Limit (Minutes)', name: 'time_limit_minutes' },
          { label: 'Interest Rate (%)', name: 'interest_rate_percent' },
        ].map(({ label, name }) => (
          <div key={name}>
            <label className="block mb-1 font-medium">{label}</label>
            <input
              type="number"
              step="0.01"
              name={name}
              value={rules[name]}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required
              disabled={loading || isDisabled}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading || isDisabled}
          className={`py-2 rounded text-white ${
            loading || isDisabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Saving...' : 'Save Rules'}
        </button>
      </form>
    </div>
  );
};

export default SavingRulesForm;
