import React, { useState, useEffect } from 'react';
import '../../../CSS/RoundManagement.css';

const RoundManagement = () => {
  const [rounds, setRounds] = useState([]);
  const [newRound, setNewRound] = useState({ start_date: '', number_of_categories: '' });
  const [lastEndDate, setLastEndDate] = useState('');
  const [minDate, setMinDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingRoundId, setEditingRoundId] = useState(null);
  const [setupInfo, setSetupInfo] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user?.token}`,
    'x-iki-id': user?.id,
    'x-sad-id': user?.sad_id,
    'x-f-id': user?.f_id
  };

  // Format date to YYYY-MM-DD in Kigali (UTC+3)
  const formatDateToKigali = (dateString) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 3); // UTC+3 for Kigali
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchRounds();
    fetchLastRound();
    fetchSetupInfo();
  }, []);

  const fetchRounds = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ikiminaRoundRoutes/selectRounds', { method: 'GET', headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setRounds(Array.isArray(data.data) ? data.data : []);
      } else {
        if (data.message?.toLowerCase() !== 'no rounds found') setErrorMessage(data.message);
        setRounds([]);
      }
    } catch {
      setErrorMessage('Failed to fetch rounds.');
    }
  };

  const fetchLastRound = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ikiminaRoundRoutes/getLastRound', { method: 'GET', headers });
      const data = await res.json();
      if (data.success && data.data) {
        const formattedEndDate = formatDateToKigali(data.data.end_date);
        setLastEndDate(formattedEndDate);

        // Set minDate to day after last round's end_date
        const nextDay = new Date(data.data.end_date);
        nextDay.setDate(nextDay.getDate() + 1);
        setMinDate(nextDay.toISOString().split('T')[0]);
      } else {
        setLastEndDate('');
        // No last round, minDate is today
        const today = new Date();
        setMinDate(today.toISOString().split('T')[0]);
      }
    } catch {
      setErrorMessage('Failed to fetch last round.');
      const today = new Date();
      setMinDate(today.toISOString().split('T')[0]);
    }
  };

  const fetchSetupInfo = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ikiminaRoundRoutes/roundSetupInfo', { method: 'GET', headers });
      const data = await res.json();
      if (res.ok) {
        setSetupInfo(data);
      } else {
        setErrorMessage('Failed to fetch setup info.');
      }
    } catch {
      setErrorMessage('Failed to fetch setup info.');
    }
  };

  // Validate if selected date is allowed for frequency and minDate
  const isDateValidForFrequency = (dateStr) => {
    if (!dateStr || !setupInfo || !minDate) return true;

    const dateObj = new Date(dateStr);
    if (isNaN(dateObj)) return false;

    // Check date is >= minDate
    const minDateObj = new Date(minDate);
    if (dateObj < minDateObj) return false;

    const dayOfWeek = dateObj.getDay();
    const dayOfMonth = dateObj.getDate();

    if (setupInfo.frequencyName.toLowerCase() === 'weekly' && Array.isArray(setupInfo.weeklyDays)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const allowedDays = setupInfo.weeklyDays.map(day => day.toLowerCase());
      const selectedDay = dayNames[dayOfWeek].toLowerCase();
      return allowedDays.includes(selectedDay);
    }

    if (setupInfo.frequencyName.toLowerCase() === 'monthly' && Array.isArray(setupInfo.monthlyDays)) {
      const allowedDates = setupInfo.monthlyDays.map(d => Number(d));
      return allowedDates.includes(dayOfMonth);
    }

    // For daily, just check date >= minDate
    return dateObj >= minDateObj;
  };

  // Date input change handler with instant validation
  const handleDateChange = (e) => {
    const value = e.target.value;
    setNewRound({ ...newRound, start_date: value });

    if (!isDateValidForFrequency(value)) {
      setErrorMessage('Selected start date is invalid based on frequency rules or minimum allowed date.');
    } else {
      setErrorMessage('');
    }
  };

  const handleAddOrUpdateRound = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!newRound.start_date || !newRound.number_of_categories) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (!isDateValidForFrequency(newRound.start_date)) {
      const freq = setupInfo?.frequencyName?.toLowerCase();
      if (freq === 'weekly') {
        setErrorMessage(`Start date must be one of: ${setupInfo.weeklyDays.join(', ')}`);
      } else if (freq === 'monthly') {
        setErrorMessage(`Start date must be one of: ${setupInfo.monthlyDays.join(', ')}`);
      } else {
        setErrorMessage('Start date is not valid.');
      }
      return;
    }

    if (setupInfo && parseInt(newRound.number_of_categories, 10) > setupInfo.maxCategories) {
      setErrorMessage(`Max allowed categories: ${setupInfo.maxCategories}`);
      return;
    }

    const payload = JSON.stringify({
      ...newRound,
      number_of_categories: parseInt(newRound.number_of_categories, 10),
      iki_id: user.id,
      f_id: user.f_id
    });

    try {
      const url = editingRoundId
        ? `http://localhost:5000/api/ikiminaRoundRoutes/updateRound/${editingRoundId}`
        : 'http://localhost:5000/api/ikiminaRoundRoutes/newRound';

      const method = editingRoundId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: payload });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message + (data.end_date ? ` Ends on: ${formatDateToKigali(data.end_date)}` : ''));
        setNewRound({ start_date: '', number_of_categories: '' });
        setEditingRoundId(null);
        fetchRounds();
        fetchLastRound();
      } else {
        setErrorMessage(data.message || 'Failed to save round.');
      }
    } catch {
      setErrorMessage('Server error.');
    }
  };

  const handleEdit = (round) => {
    setNewRound({
      start_date: formatDateToKigali(round.start_date),
      number_of_categories: round.number_of_categories.toString()
    });
    setEditingRoundId(round.round_id);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleDelete = async (round_id) => {
    if (!window.confirm('Are you sure you want to delete this round?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/ikiminaRoundRoutes/deleteRound/${round_id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Round deleted successfully.');
        fetchRounds();
        fetchLastRound();
      } else {
        setErrorMessage(data.message || 'Failed to delete.');
      }
    } catch {
      setErrorMessage('Error deleting round.');
    }
  };

  return (
    <div className="container">
      <h1 className="title">Ikimina Round Management</h1>

      {errorMessage && <div className="error-message"><p>{errorMessage}</p></div>}
      {successMessage && <div className="success-message"><p>{successMessage}</p></div>}

      <div className="ikimina-info">
        <h2>Ikimina Info</h2>
        {user ? (
          <>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>ID:</strong> {user.id}</p>
            {setupInfo && (
              <>
                <p><strong>Frequency:</strong> {setupInfo.frequencyName}</p>
                {setupInfo.weeklyDays?.length > 0 && <p><strong>Weekly Days:</strong> {setupInfo.weeklyDays.join(', ')}</p>}
                {setupInfo.monthlyDays?.length > 0 && <p><strong>Monthly Days:</strong> {setupInfo.monthlyDays.join(', ')}</p>}
                <p><strong>Max Categories:</strong> {setupInfo.maxCategories}</p>
              </>
            )}
          </>
        ) : <p>No user found.</p>}
      </div>

      <div className="form-section">
        <h2>{editingRoundId ? 'Edit Round' : 'Add New Round'}</h2>
        {lastEndDate && <p className="hint">Last round ended on: <strong>{lastEndDate}</strong></p>}

        {setupInfo?.frequencyName?.toLowerCase() === 'weekly' && setupInfo.weeklyDays?.length > 0 && (
          <p className="hint">Start date must be one of: {setupInfo.weeklyDays.join(', ')}</p>
        )}
        {setupInfo?.frequencyName?.toLowerCase() === 'monthly' && setupInfo.monthlyDays?.length > 0 && (
          <p className="hint">Start date must be one of: {setupInfo.monthlyDays.join(', ')}</p>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleAddOrUpdateRound(); }}>
          <input
            type="date"
            value={newRound.start_date}
            min={minDate}
            onChange={handleDateChange}
            required
          />
          <input
            type="number"
            value={newRound.number_of_categories}
            onChange={(e) => setNewRound({ ...newRound, number_of_categories: e.target.value })}
            required
            placeholder="Number of Categories"
            min={1}
          />
          <button type="submit" className="btn">
            {editingRoundId ? 'Update Round' : 'Add Round'}
          </button>
          {editingRoundId && (
            <button
              type="button"
              className="btn cancel"
              onClick={() => {
                setEditingRoundId(null);
                setNewRound({ start_date: '', number_of_categories: '' });
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="list-section">
        <h2>Rounds List</h2>
        {rounds.length === 0 ? (
          <p>No rounds found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Year</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map(round => (
                <tr key={round.round_id}>
                  <td>{round.round_number}</td>
                  <td>{round.round_year}</td>
                  <td>{formatDateToKigali(round.start_date)}</td>
                  <td>{formatDateToKigali(round.end_date)}</td>
                  <td>{round.round_status}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(round)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(round.round_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RoundManagement;
