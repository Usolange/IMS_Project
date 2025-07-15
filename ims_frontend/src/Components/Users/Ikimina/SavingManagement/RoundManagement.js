import React, { useState, useEffect } from 'react';
import '../../../CSS/RoundManagement.css';

const RoundManagement = () => {
  const [rounds, setRounds] = useState([]);
  const [newRound, setNewRound] = useState({ start_date: '', number_of_categories: '' });
  const [lastEndDate, setLastEndDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingRoundId, setEditingRoundId] = useState(null);
  const [setupInfo, setSetupInfo] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-iki-id': user?.id
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
      if (data.success) setRounds(data.data);
      else setErrorMessage(data.message);
    } catch {
      setErrorMessage('Failed to fetch rounds.');
    }
  };

  const fetchLastRound = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ikiminaRoundRoutes/getLastRound', { method: 'GET', headers });
      const data = await res.json();
      if (data.success && data.data) {
        const formatted = new Date(data.data.end_date).toISOString().split('T')[0];
        setLastEndDate(formatted);
      } else {
        setLastEndDate('');
      }
    } catch {
      setErrorMessage('Failed to fetch last round.');
    }
  };

  const fetchSetupInfo = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ikiminaRoundRoutes/roundSetupInfo', { method: 'GET', headers });
      const data = await res.json();
      if (res.ok) setSetupInfo(data);
      else setErrorMessage('Failed to fetch setup info.');
    } catch {
      setErrorMessage('Failed to fetch setup info.');
    }
  };

  const handleAddOrUpdateRound = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!newRound.start_date || !newRound.number_of_categories) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (setupInfo && parseInt(newRound.number_of_categories) > setupInfo.maxCategories) {
      setErrorMessage(`Max allowed categories: ${setupInfo.maxCategories}`);
      return;
    }

    const payload = JSON.stringify({ ...newRound, iki_id: user.id });

    try {
      const url = editingRoundId
        ? `http://localhost:5000/api/ikiminaRoundRoutes/updateRound/${editingRoundId}`
        : 'http://localhost:5000/api/ikiminaRoundRoutes/newRound';

      const method = editingRoundId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: payload });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message + (data.end_date ? ` Ends on: ${data.end_date}` : ''));
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
      start_date: round.start_date.split('T')[0],
      number_of_categories: ''
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
        {lastEndDate && (
          <p className="hint">Last round ended on: <strong>{lastEndDate}</strong></p>
        )}
        {setupInfo?.frequencyName && (
          <p className="hint">
            {setupInfo.frequencyName === 'weekly' && setupInfo.weeklyDays?.length
              ? `Start date must match one of these days: ${setupInfo.weeklyDays.join(', ')}`
              : setupInfo.frequencyName === 'monthly' && setupInfo.monthlyDays?.length
              ? `Start date must match one of these dates: ${setupInfo.monthlyDays.join(', ')}`
              : ''}
          </p>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleAddOrUpdateRound(); }}>
          <input
            type="date"
            value={newRound.start_date}
            onChange={(e) => setNewRound({ ...newRound, start_date: e.target.value })}
            required
            min={lastEndDate || ''}
          />
          <input
            type="number"
            value={newRound.number_of_categories}
            onChange={(e) => setNewRound({ ...newRound, number_of_categories: e.target.value })}
            required
            placeholder="Number of Categories"
          />
          <button type="submit" className="btn">
            {editingRoundId ? 'Update Round' : 'Add Round'}
          </button>
          {editingRoundId && (
            <button type="button" className="btn cancel" onClick={() => {
              setEditingRoundId(null);
              setNewRound({ start_date: '', number_of_categories: '' });
            }}>Cancel</button>
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
                <th>Round #</th>
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
                  <td data-label="Round #">{round.round_number}</td>
                  <td data-label="Year">{round.cycle_year}</td>
                  <td data-label="Start">{round.start_date}</td>
                  <td data-label="End">{round.end_date}</td>
                  <td data-label="Status">{round.round_status}</td>
                  <td data-label="Actions">
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
