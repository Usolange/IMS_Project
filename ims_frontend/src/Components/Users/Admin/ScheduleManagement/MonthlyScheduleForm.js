import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MonthlyScheduleForm = ({ f_id, onClose }) => {
  const [ikiminaList, setIkiminaList] = useState([]);
  const [selectedIkiminaId, setSelectedIkiminaId] = useState('');
  const [selectedIkiminaName, setSelectedIkiminaName] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchIkiminaList = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const user = JSON.parse(storedUser);
        const sad_id = user?.id;

        if (!sad_id) {
          alert('User ID not found. Please login again.');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/LocationManagerRoutes/select?sad_id=${sad_id}`);
        setIkiminaList(response.data);
      } catch (err) {
        console.error('Failed to load Ikimina list:', err);
        alert('Failed to fetch Ikimina list');
      }
    };

    fetchIkiminaList();
  }, []);

  const handleIkiminaChange = (e) => {
    const selectedId = e.target.value;
    setSelectedIkiminaId(selectedId);
    const selected = ikiminaList.find(item => item.ikimina_id.toString() === selectedId);
    setSelectedIkiminaName(selected?.ikimina_name || '');
  };

  const handleDateChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedDates([...selectedDates, value]);
    } else {
      setSelectedDates(selectedDates.filter(date => date !== value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedIkiminaId || !selectedIkiminaName || selectedDates.length === 0 || !time) {
      return alert('All fields are required, including time and at least one date');
    }

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(
        'http://localhost:5000/api/monthlyTimeRoutes/newSchedule',
        {
          ikimina_id: selectedIkiminaId,
          ikimina_name: selectedIkiminaName,
          selected_dates: selectedDates,
          mtime_time: time,
          f_id
        },
        {
          headers: { 'x-sad-id': user.id }
        }
      );
      alert('Monthly schedule saved successfully');
      onClose();
    } catch (err) {
      console.error('Error saving monthly schedule:', err);
      alert(err?.response?.data?.message || 'Failed to save monthly schedule');
    } finally {
      setSaving(false);
    }
  };

  // Create array for days 1 to 31
  const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  return (
    <form onSubmit={handleSubmit} className="schedule-form">
      <div className="form-group">
        <label>Ikimina:</label>
        <select
          value={selectedIkiminaId}
          onChange={handleIkiminaChange}
          required
        >
          <option value="">-- Select Ikimina --</option>
          {ikiminaList.map(item => (
            <option key={item.ikimina_id} value={item.ikimina_id}>
              {item.ikimina_id} == {item.ikimina_name} - Cell: {item.cell}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Dates of the Month:</label>
        <div className="checkbox-group">
          {daysInMonth.map(date => (
            <label key={date}>
              <input
                type="checkbox"
                value={date}
                checked={selectedDates.includes(date)}
                onChange={handleDateChange}
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
        <button type="submit" disabled={saving || !selectedIkiminaId || selectedDates.length === 0 || !time}>
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
