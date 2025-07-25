import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function MemberSavingSummary() {
  const [summary, setSummary] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const memberId = user?.id;
  const ikiId = user?.iki_id;

  // Helper to format slot_time properly
  const formatSlotTime = (slotTime) => {
    if (!slotTime) return '—';

    if (typeof slotTime === 'string' && slotTime.length >= 5) {
      return slotTime.slice(0, 5);
    }

    if (slotTime instanceof Date) {
      // Use UTC time parts because date is epoch
      const hours = slotTime.getUTCHours().toString().padStart(2, '0');
      const minutes = slotTime.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // Sometimes data might come as ISO string or other format, try parsing:
    const parsed = new Date(slotTime);
    if (!isNaN(parsed)) {
      const hours = parsed.getUTCHours().toString().padStart(2, '0');
      const minutes = parsed.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    return '—';
  };

  useEffect(() => {
    if (!memberId || !ikiId) {
      setError('User info missing. Please log in again.');
      return;
    }
    fetchSummaryWithRounds(memberId, ikiId, selectedRound);
  }, [memberId, ikiId, selectedRound]);

  const fetchSummaryWithRounds = async (memberId, ikiId, roundId) => {
    setLoading(true);
    try {
      const url = `http://localhost:5000/api/savingManagementRoutes/memberSavingSummary/${memberId}/${ikiId}`;
      const params = {};
      if (roundId && roundId !== 'all') {
        params.roundIds = roundId; // pass roundIds param for backend filter
      }
      const res = await axios.get(url, { params });
      setRounds(res.data.rounds || []);
      setSummary(res.data.summary || null);
      setError('');
    } catch (err) {
      console.error('Error fetching summary with rounds:', err);
      setError('Server error while fetching summary.');
      setSummary(null);
      setRounds([]);
    }
    setLoading(false);
  };

  const exportToExcel = () => {
    if (!summary?.slots?.length) return alert('No slot data to export.');

    const selectedRoundObj = rounds.find((r) => r.round_id === Number(selectedRound));
    const roundName = selectedRoundObj
      ? `Round ${rounds.indexOf(selectedRoundObj) + 1} - ${new Date(selectedRoundObj.start_date).getFullYear()}`
      : 'All Rounds';

    const roundDetails = selectedRoundObj
      ? [
          { Info: `Round Year: ${new Date(selectedRoundObj.start_date).getFullYear()}` },
          { Info: `Start Date: ${new Date(selectedRoundObj.start_date).toLocaleDateString()}` },
          { Info: `End Date: ${new Date(selectedRoundObj.end_date).toLocaleDateString()}` },
          {},
        ]
      : [{ Info: `Round Filter: All Rounds` }, {}];

    const dataRows = summary.slots.map((slot) => ({
      Date: slot.slot_date ? new Date(slot.slot_date).toLocaleDateString() : '—',
      Time: formatSlotTime(slot.slot_time),
      Saved_Amount: slot.saved_amount || 0,
      Status: slot.slot_status,
      Penalty: slot.penalty_amount > 0 ? slot.penalty_amount : 0,
      Penalty_Paid: slot.penalty_amount > 0 ? (slot.penalty_paid ? 'Yes' : 'No') : '-',
    }));

    const combinedData = [...roundDetails, ...dataRows];

    const ws = XLSX.utils.json_to_sheet(combinedData, { skipHeader: false });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Saving Summary');

    const fileName = `Saving_Summary_${roundName.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) return <p className="dashboard-loading">Loading summary and rounds...</p>;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!summary || !summary.aggregates) return null;

  const aggregates = summary.aggregates ?? {};
  const slots = summary.slots ?? [];

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">💰 My Saving Overview</h2>

      <label htmlFor="roundSelect">
        <strong>Filter by Round:</strong>{' '}
      </label>
      <select id="roundSelect" value={selectedRound} onChange={(e) => setSelectedRound(e.target.value)}>
        <option value="all">All Rounds</option>
        {rounds.map((round, index) => {
          const year = new Date(round.start_date).getFullYear();
          return (
            <option key={round.round_id} value={round.round_id}>
              Round {index + 1} - {year}
            </option>
          );
        })}
      </select>

      <ul className="dashboard-summary-list">
        <li>
          <strong>Total Saved:</strong> RWF {aggregates.total_saved_amount ?? 0}
        </li>
        <li>
          <strong>Completed Slots:</strong> {aggregates.slots_completed} / {aggregates.total_slots}
        </li>
        <li>
          <strong>Penalties Paid:</strong> RWF {aggregates.total_penalties_paid ?? 0}
        </li>
        <li>
          <strong>Penalties Unpaid:</strong> RWF {aggregates.total_penalties_unpaid ?? 0}
        </li>
        <li>
          <strong>Average Saving:</strong> RWF {aggregates.average_saving_amount?.toFixed(2) ?? 0}
        </li>
        <li>
          <strong>Last Saving Date:</strong>{' '}
          {aggregates.most_recent_saving_at ? new Date(aggregates.most_recent_saving_at).toLocaleString() : '—'}
        </li>
        <li>
          <strong>Next Upcoming Slot:</strong>{' '}
          {aggregates.next_upcoming_slot_date ? new Date(aggregates.next_upcoming_slot_date).toLocaleDateString() : '—'}
        </li>
      </ul>

      <div className="dashboard-actions">
        <button className="dashboard-export-btn" onClick={exportToExcel} disabled={!slots.length}>
          📥 Export {selectedRound === 'all' ? 'All Rounds' : 'Selected Round'}
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
            {slots
              .slice(-5)
              .reverse()
              .map((slot) => (
                <tr key={slot.slot_id}>
                  <td>{slot.slot_date ? new Date(slot.slot_date).toLocaleDateString() : '—'}</td>
                  <td>{formatSlotTime(slot.slot_time)}</td>
                  <td>{slot.saved_amount ? `RWF ${slot.saved_amount}` : '—'}</td>
                  <td>{slot.slot_status}</td>
                  <td>{slot.penalty_amount > 0 ? `RWF ${slot.penalty_amount}` : '—'}</td>
                  <td>{slot.penalty_amount > 0 ? (slot.penalty_paid ? '✔ Yes' : 'No') : '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
