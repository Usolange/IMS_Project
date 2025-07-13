import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../CSS/PenaltyManager.css';

const PenaltyManager = ({ iki_id }) => {
  const [penaltyConfig, setPenaltyConfig] = useState(null);
  const [penalties, setPenalties] = useState([]);
  const [form, setForm] = useState({
    saving_period_gap: '',
    penalty_date_delay: '',
    penalty_time_delay: ''
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!iki_id) return;
    fetchPenalties();
    fetchPenaltyConfig();
  }, [iki_id]);

  const fetchPenalties = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/penalityManagementRoutes/all', {
        headers: { 'x-iki-id': iki_id }
      });
      setPenalties(res.data.data);
    } catch (err) {
      console.error('Fetch penalty logs error:', err);
    }
  };

  const fetchPenaltyConfig = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/penalityManagementRoutes/myInfo', {
        headers: { 'x-iki-id': iki_id }
      });
      setPenaltyConfig(res.data.data);
      setForm(res.data.data);
    } catch (err) {
      console.error('Fetch penalty config error:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMsg('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/penalityManagementRoutes/myPenalties', form, {
        headers: { 'x-iki-id': iki_id }
      });
      setMsg('✅ Penalty settings updated.');
      fetchPenaltyConfig();
    } catch (err) {
      console.error('Update penalty config failed:', err);
      setMsg('❌ Failed to update settings.');
    }
  };

  return (
    <div className="penalty-container">
      <h2>⚖️ Penalty Settings</h2>
      <form onSubmit={handleUpdate} className="penalty-form">
        <label>Saving Period Gap (days):
          <input type="number" name="saving_period_gap" value={form.saving_period_gap} onChange={handleChange} />
        </label>

        <label>Penalty for Date Delay (RWF):
          <input type="number" name="penalty_date_delay" value={form.penalty_date_delay} onChange={handleChange} />
        </label>

        <label>Penalty for Time Delay (RWF):
          <input type="number" name="penalty_time_delay" value={form.penalty_time_delay} onChange={handleChange} />
        </label>

        <button type="submit">💾 Update Settings</button>
      </form>

      {msg && <p className="penalty-message">{msg}</p>}

      <h2>📋 Member Penalty Log</h2>
      <table className="penalty-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Member</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Reason</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {penalties.length === 0 ? (
            <tr><td colSpan="6">No penalties recorded.</td></tr>
          ) : penalties.map((p, i) => (
            <tr key={p.penalty_id}>
              <td>{i + 1}</td>
              <td>{p.member_names}</td>
              <td>{p.penalty_type}</td>
              <td>{p.penalty_amount} RWF</td>
              <td>{p.reason}</td>
              <td>{new Date(p.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PenaltyManager;
