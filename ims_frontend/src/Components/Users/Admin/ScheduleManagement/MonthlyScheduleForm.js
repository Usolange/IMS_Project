import React, { useState } from 'react';
import axios from 'axios';

const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

const MonthlyScheduleForm = ({ f_id, onClose }) => {
  const [ikiminaName, setIkiminaName] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleDate = (date) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ikiminaName.trim()) {
      alert('Please enter the Ikimina name');
      return;
    }
    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }
    if (!time) {
      alert('Please select a time');
      return;
    }

    setSaving(true);

    try {
      const rawUser = localStorage.getItem('user');
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (!user?.id) throw new Error('User not logged in');

      const payload = {
        ikimina_name: ikiminaName.trim(),
        monthlytime_dates: selectedDates,
        monthlytime_time: time,
        f_id,
      };

      const res = await axios.post(
        'http://localhost:5000/api/monthlyTimeRoutes',
        payload,
        {
          headers: {
            'x-sad-id': user.id,
          },
        }
      );

      if (res.status === 201) {
        alert('Schedule saved successfully');
        onClose();
      } else {
        alert('Failed to save schedule. Try again.');
        console.warn('Unexpected response:', res.data);
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
        <label>Select Dates:</label>
        <div className="dates-checkboxes">
          {daysInMonth.map((date) => (
            <label key={date} className="checkbox-label">
              <input
                type="checkbox"
                value={date}
                checked={selectedDates.includes(date)}
                onChange={() => toggleDate(date)}
              />
              {date}
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

export default MonthlyScheduleForm;
