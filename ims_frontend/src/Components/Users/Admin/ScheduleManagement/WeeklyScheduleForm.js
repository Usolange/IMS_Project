import React, { useState } from 'react';
import axios from 'axios';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyScheduleForm = ({ f_id, onClose }) => {
  const [ikiminaName, setIkiminaName] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  const handleDayToggle = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ikiminaName.trim()) {
      alert('Please enter the Ikimina name');
      return;
    }
    if (!selectedDays.length) {
      alert('Please select at least one day');
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
        weeklytime_days: selectedDays,      // must match backend
        weeklytime_time: time,              // must match backend
        f_id,
      };

      const res = await axios.post(
        'http://localhost:5000/api/weeklyTimeRoutes',
        payload,
        { headers: { 'x-sad-id': user.id } }
      );

      if (res.status === 201) {
        alert('Weekly schedule saved successfully');
        onClose();
      } else {
        alert('Failed to save schedule. Try again.');
      }
    } catch (error) {
      console.error('Error saving weekly schedule:', error.response?.data || error.message);
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
        <label>Select Day(s):</label>
        <div className="day-checkboxes">
          {daysOfWeek.map(day => (
            <label key={day} className="day-checkbox">
              <input
                type="checkbox"
                value={day}
                checked={selectedDays.includes(day)}
                onChange={() => handleDayToggle(day)}
              />
              {day}
            </label>
          ))}
        </div>
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

export default WeeklyScheduleForm;
