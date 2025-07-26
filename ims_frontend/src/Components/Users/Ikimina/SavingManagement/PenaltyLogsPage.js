import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../../CSS/PenaltyLogs.css';

const PenaltyLogsPage = () => {
  const [penalties, setPenalties] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('current');
  const [ikiName, setIkiName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) return;
        const iki_id = user.id;
        setIkiName(user.name);

        const res = await axios.get(`http://localhost:5000/api/savingRulesRoutes/rounds/forikimina/${iki_id}`);
        setRounds(res.data);
      } catch {
        alert('Failed to load Ikimina rounds');
      }
    };
    fetchRounds();
  }, []);

  useEffect(() => {
    const fetchPenalties = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          alert('Ikimina user not found. Please log in again.');
          return;
        }

        const iki_id = user.id;

        const params = {};
        if (selectedRoundId === 'current') params.mode = 'current';
        else if (selectedRoundId !== 'all') params.round_id = selectedRoundId;

        const response = await axios.get(`http://localhost:5000/api/savingRulesRoutes/forikimina/${iki_id}`, { params });
        setPenalties(response.data);
      } catch (error) {
        console.error('Error fetching penalties:', error);
        alert('Failed to load penalty logs.');
      }
      setLoading(false);
    };

    fetchPenalties();
  }, [selectedRoundId]);

  const formatToKigali = (dateString, includeTime = false) => {
    if (!dateString) return '-';
    const options = {
      timeZone: 'Africa/Kigali',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    return new Intl.DateTimeFormat('en-GB', options).format(new Date(dateString));
  };

  return (
    <div className="penalty-logs-container">
      <h2>Penalty Logs for Ikimina: <span className="ikimina-name">{ikiName}</span></h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>Filter by Round:</label>{' '}
        <select value={selectedRoundId} onChange={(e) => setSelectedRoundId(e.target.value)}>
          <option value="current">Current Round (Active/Completed)</option>
          <option value="all">All Rounds</option>
          {rounds.map(r => (
            <option key={r.round_id} value={r.round_id}>
              Round {r.round_number} ({r.round_year}) - {r.round_status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading penalty logs...</p>
      ) : penalties.length === 0 ? (
        <p>No penalty logs found for this Ikimina.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Round</th>
              <th>Slot ID</th>
              <th>Penalty Type</th>
              <th>Amount (RWF)</th>
              <th>Saving Date</th>
              <th>Paid</th>
              <th>Paid At</th>
            </tr>
          </thead>
          <tbody>
            {penalties.map(log => (
              <tr key={log.penalty_id}>
                <td>{log.member_names}</td>
                <td>{log.round_number} ({log.round_year})</td>
                <td>{log.slot_id}</td>
                <td>{log.penalty_type}</td>
                <td>{log.penalty_amount}</td>
                <td>{formatToKigali(log.saving_date)}</td>
                <td>{log.is_paid ? 'Yes' : 'No'}</td>
                <td>{log.paid_at ? formatToKigali(log.paid_at, true) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PenaltyLogsPage;
