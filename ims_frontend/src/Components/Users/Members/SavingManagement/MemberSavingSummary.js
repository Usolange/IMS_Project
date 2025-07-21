import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
export default function MemberSavingSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const memberId = user?.id;
  const ikiId = user?.iki_id;

  useEffect(() => {
    if (!memberId || !ikiId) {
      setError('User info missing. Please log in again.');
      return;
    }

    fetchSummary(memberId, ikiId);
  }, [memberId, ikiId]);

  const fetchSummary = async (memberId, ikiId) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/memberSavingSummary/${memberId}/${ikiId}`);
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError('Server error while fetching summary.');
    }
    setLoading(false);
  };

  const exportToExcel = () => {
    if (!summary?.slots?.length) return alert('No slot data to export.');

    const data = summary.slots.map(slot => ({
      Date: slot.slot_date,
      Time: slot.slot_time?.slice(0, 5),
      Saved_Amount: slot.saved_amount || 0,
      Status: slot.slot_status,
      Penalty: slot.penalty_amount || 0,
      Penalty_Paid: slot.penalty_paid ? 'Yes' : 'No'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Saving Summary');
    XLSX.writeFile(wb, 'Saving_Summary.xlsx');
  };

  if (loading) return <p className="dashboard-loading">Loading summary...</p>;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!summary) return null;

  const { aggregates, slots } = summary;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">💰 My Saving Overview</h2>

      <ul className="dashboard-summary-list">
        <li><strong>Total Saved:</strong> RWF {aggregates.total_saved_amount ?? 0}</li>
        <li><strong>Completed Slots:</strong> {aggregates.slots_completed} / {aggregates.total_slots}</li>
        <li><strong>Penalties Paid:</strong> RWF {aggregates.total_penalties_paid ?? 0}</li>
        <li><strong>Penalties Unpaid:</strong> RWF {aggregates.total_penalties_unpaid ?? 0}</li>
        <li><strong>Average Saving:</strong> RWF {aggregates.average_saving_amount?.toFixed(2) ?? 0}</li>
        <li><strong>Last Saving Date:</strong> {aggregates.most_recent_saving_at ? new Date(aggregates.most_recent_saving_at).toLocaleString() : '—'}</li>
        <li><strong>Next Upcoming Slot:</strong> {aggregates.next_upcoming_slot_date ?? '—'}</li>
      </ul>

      <div className="dashboard-actions">
        <button
          className="dashboard-export-btn"
          onClick={exportToExcel}
          disabled={!slots.length}
        >
          📥 Export Recent Slots
        </button>
      </div>

      <h3>🕓 Recent Saving Activities</h3>

      <div className="table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Saved Amount</th>
              <th>Status</th>
              <th>Penalty</th>
              <th>Penalty Paid</th>
            </tr>
          </thead>
          <tbody>
            {slots.slice(-5).reverse().map((slot) => (
              <tr key={slot.slot_id}>
                <td>{new Date(slot.slot_date).toLocaleDateString()}</td>
                <td>{slot.slot_time?.slice(0, 5)}</td>
                <td>{slot.saved_amount ? `RWF ${slot.saved_amount}` : '—'}</td>
                <td>{slot.slot_status}</td>
                <td>{slot.penalty_amount ? `RWF ${slot.penalty_amount}` : '—'}</td>
                <td>{slot.penalty_paid ? '✔ Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
