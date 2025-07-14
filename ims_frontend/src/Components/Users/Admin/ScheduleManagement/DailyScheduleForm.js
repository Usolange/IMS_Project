import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DailyScheduleForm = ({ f_id, onClose }) => {
  const [ikiminaList, setIkiminaList] = useState([]);
  const [selectedIkiminaId, setSelectedIkiminaId] = useState('');
  const [selectedIkiminaName, setSelectedIkiminaName] = useState('');
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

  // Filter by frequency category
  const filteredIkiminaList = ikiminaList.filter(item => item.f_id === f_id);

  const handleIkiminaChange = (e) => {
    const selectedId = e.target.value;
    setSelectedIkiminaId(selectedId);

    const selected = filteredIkiminaList.find(
      item => String(item?.location_id) === selectedId 
    );

    setSelectedIkiminaName(selected?.ikimina_name || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIkiminaId || !selectedIkiminaName || !time) {
      return alert('All fields are required');
    }

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(
        'http://localhost:5000/api/dailyTimeRoutes/newSchedule',
        {
          location_id: selectedIkiminaId,
          ikimina_name: selectedIkiminaName,
          dtime_time: time,
          f_id,
        },
        {
          headers: { 'x-sad-id': user.id },
        }
      );
      alert('Schedule saved successfully');
      onClose();
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert(err?.response?.data?.message || 'Failed to save schedule');
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
          {filteredIkiminaList.map((item) => (
            <option key={item.location_id} value={item.location_id}>
              {item.ikimina_name} - Cell: {item.cell}
            </option>
          ))}
        </select>
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
        <button type="submit" disabled={saving || !selectedIkiminaId || !time}>
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

