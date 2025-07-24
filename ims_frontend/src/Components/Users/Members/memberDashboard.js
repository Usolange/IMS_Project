import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function MemberDashboard() {
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
      const res = await axios.get(`http://localhost:5000/api/savingManagementRoutes/memberSavingSummary/${memberId}/${ikiId}`);
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

  const styles = {
    container: {
      maxWidth: 600,
      margin: '2rem auto',
      background: '#fff',
      borderRadius: 8,
      padding: '1.5rem 2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#1e293b',
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '700',
      marginBottom: '1rem',
      color: '#0c4a6e',
      textAlign: 'center',
    },
    list: {
      listStyleType: 'none',
      paddingLeft: 0,
      marginBottom: '1.5rem',
    },
    listItem: {
      fontSize: '1rem',
      marginBottom: '0.6rem',
      paddingBottom: '0.3rem',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      color: '#334155',
    },
    listItemStrong: {
      color: '#1e40af',
      fontWeight: '600',
    },
    actions: {
      textAlign: 'center',
    },
    exportBtn: {
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '0.6rem 1.2rem',
      fontSize: '1rem',
      fontWeight: '600',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'background-color 0.3s ease',
    },
    exportBtnDisabled: {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
    },
    loadingError: {
      maxWidth: 600,
      margin: '3rem auto',
      fontSize: '1.1rem',
      textAlign: 'center',
      fontWeight: '600',
    },
    errorText: {
      color: '#dc2626',
    },
  };

  if (loading) return <p style={styles.loadingError}>Loading summary...</p>;
  if (error) return <div style={{ ...styles.loadingError, ...styles.errorText }}>{error}</div>;
  if (!summary) return null;

  const { aggregates, slots } = summary;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Saving Overview</h2>

      <ul style={styles.list}>
        <li style={styles.listItem}>
          <strong style={styles.listItemStrong}>Total Saved:</strong> RWF {aggregates.total_saved_amount ?? 0}
        </li>
        <li style={styles.listItem}>
          <strong style={styles.listItemStrong}>Completed Slots:</strong> {aggregates.slots_completed} / {aggregates.total_slots}
        </li>
        <li style={styles.listItem}>
          <strong style={styles.listItemStrong}>Penalties Paid:</strong> RWF {aggregates.total_penalties_paid ?? 0}
        </li>
        <li style={styles.listItem}>
          <strong style={styles.listItemStrong}>Penalties Unpaid:</strong> RWF {aggregates.total_penalties_unpaid ?? 0}
        </li>
        <li style={styles.listItem}>
          <strong style={styles.listItemStrong}>Average Saving:</strong> RWF {aggregates.average_saving_amount?.toFixed(2) ?? 0}
        </li>
        <li style={styles.listItem}>
          <strong style={styles.listItemStrong}>Last Saving Date:</strong> {aggregates.most_recent_saving_at ? new Date(aggregates.most_recent_saving_at).toLocaleString() : '—'}
        </li>
        <li style={styles.listItem}>
          <strong style={styles.listItemStrong}>Next Upcoming Slot:</strong> {aggregates.next_upcoming_slot_date ?? '—'}
        </li>

        {/* NEW ITEMS */}
        <li style={styles.listItem}>
          <strong style={styles.listItemStrong}>My Completed Saving Slots:</strong> {aggregates.member_completed_slots ?? 0}
        </li>
        <li style={styles.listItem}>
          <strong style={styles.listItemStrong}>Group Completed Saving Slots:</strong> {aggregates.group_completed_slots ?? 0}
        </li>
      </ul>

      <div style={styles.actions}>
        <button
          style={slots.length ? styles.exportBtn : { ...styles.exportBtn, ...styles.exportBtnDisabled }}
          onClick={exportToExcel}
          disabled={!slots.length}
          onMouseOver={e => {
            if (slots.length) e.currentTarget.style.backgroundColor = '#1d4ed8';
          }}
          onMouseOut={e => {
            if (slots.length) e.currentTarget.style.backgroundColor = '#2563eb';
          }}
        >
          📥 Export Recent Savings
        </button>
      </div>
    </div>
  );
}
