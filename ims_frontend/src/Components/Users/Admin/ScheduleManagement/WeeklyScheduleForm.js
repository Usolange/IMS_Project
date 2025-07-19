import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeeklyScheduleForm = ({ f_id, onClose }) => {
  const [ikiminaList, setIkiminaList] = useState([]);
  const [selectedIkiminaId, setSelectedIkiminaId] = useState('');
  const [selectedIkiminaName, setSelectedIkiminaName] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
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

        const response = await axios.get(`http://localhost:5000/api/locationManagerRoutes/select?sad_id=${sad_id}`);
        setIkiminaList(response.data);
      } catch (err) {
        console.error('Failed to load Ikimina list:', err);
        alert('Failed to fetch Ikimina list');
      }
    };

    fetchIkiminaList();
  }, []);

  // Filter ikiminaList based on f_id
  const filteredIkiminaList = ikiminaList.filter(item => item.f_id === f_id);

  const handleIkiminaChange = (e) => {
    const selectedId = e.target.value;
    setSelectedIkiminaId(selectedId);
    const selected = filteredIkiminaList.find(item => String(item?.location_id) === selectedId);

    setSelectedIkiminaName(selected?.ikimina_name || '');
  };

  const handleDayChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedDays([...selectedDays, value]);
    } else {
      setSelectedDays(selectedDays.filter(day => day !== value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedIkiminaId || !selectedIkiminaName || selectedDays.length === 0 || !time) {
      return alert('All fields are required, including time and at least one day');
    }

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const formattedTime = time.length === 5 ? `${time}:00` : time;
      
      await axios.post(
        'http://localhost:5000/api/weeklyTimeRoutes/newSchedule',
        {
          location_id: selectedIkiminaId,
          ikimina_name: selectedIkiminaName,
          selected_days: selectedDays,
          wtime_time: formattedTime,
          f_id
        },
        {
          headers: { 'x-sad-id': user.id }
        }
      );
      alert('Weekly schedule saved successfully');
      onClose();
    } catch (err) {
      console.error('Error saving weekly schedule:', err);
      alert(err?.response?.data?.message || 'Failed to save weekly schedule');
    } finally {
      setSaving(false);
    }
  };

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
          {filteredIkiminaList.map(item => (
            <option key={item.location_id} value={item.location_id}>
              {item.ikimina_name} - Cell: {item.cell}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Days of the Week:</label>
        <div className="checkbox-group">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
            <label key={day}>
              <input
                type="checkbox"
                value={day}
                checked={selectedDays.includes(day)}
                onChange={handleDayChange}
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
        <button type="submit" disabled={saving || !selectedIkiminaId || selectedDays.length === 0 || !time}>
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
