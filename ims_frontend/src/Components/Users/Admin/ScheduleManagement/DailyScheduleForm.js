import React, { useState } from 'react';
import axios from 'axios';

const DailyScheduleForm = ({ f_id, onClose }) => {
  const [ikiminaName, setIkiminaName] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!ikiminaName.trim()) {
    alert('Please enter the Ikimina name');
    return;
  }
  if (!time) {
    alert('Please select a time');
    return;
  }

  setSaving(true);

  try {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!user?.id) throw new Error('User not logged in');

    const payload = {
      ikimina_name: ikiminaName,
      dtime_time: time,
      f_id,
    };

    const res = await axios.post(
      'http://localhost:5000/api/dailyTimeRoutes', // <-- corrected here
      payload,
      { headers: { 'x-sad-id': user.id } }
    );

    if (res.status === 201) {
      alert('Schedule saved successfully');
      onClose();
    } else {
      alert('Failed to save schedule. Try again.');
    }
  } catch (error) {
    console.error('Save schedule error:', error.response?.data || error.message);
    alert('Failed to save schedule. Try again.');
  } finally {
    setSaving(false);
  }
};


  return (
    <form onSubmit={handleSubmit} className="schedule-form">
      <div className="form-group">
        <label>Ikimina Name:</label>
        <input
          type="text"
          value={ikiminaName}
          onChange={(e) => setIkiminaName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Time:</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </div>

      <div className="form-buttons">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
        <button type="button" onClick={onClose} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DailyScheduleForm;
