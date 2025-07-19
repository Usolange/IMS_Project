import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../CSS/DailyScheduleForm.css';

const DailyScheduleForm = ({ f_id, onClose }) => {
  const [ikiminaList, setIkiminaList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedIkiminaId, setSelectedIkiminaId] = useState('');
  const [selectedIkiminaName, setSelectedIkiminaName] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchIkiminaList = async () => {
      try {
        setLoadingList(true);
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
      } finally {
        setLoadingList(false);
      }
    };

    fetchIkiminaList();
  }, []);

  // Filter Ikimina by frequency category id
  const filteredIkiminaList = ikiminaList.filter(item => Number(item.f_id) === Number(f_id));

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
      alert('All fields are required');
      return;
    }

   

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const formattedTime = time.length === 5 ? `${time}:00` : time;
      await axios.post(
        'http://localhost:5000/api/dailyTimeRoutes/newSchedule',
        {
          location_id: selectedIkiminaId,
          ikimina_name: selectedIkiminaName,
          dtime_time: formattedTime,
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
    <form onSubmit={handleSubmit} className="schedule-form" aria-label="Daily Schedule Form">
      <div className="form-group">
        <label htmlFor="ikimina-select">Ikimina:</label>
        {loadingList ? (
          <p>Loading Ikimina list...</p>
        ) : filteredIkiminaList.length === 0 ? (
          <p>No Ikimina available for this category.</p>
        ) : (
          <select
            id="ikimina-select"
            value={selectedIkiminaId}
            onChange={handleIkiminaChange}
            aria-required="true"
            required
          >
            <option value="">-- Select Ikimina --</option>
            {filteredIkiminaList.map((item) => (
              <option key={item.location_id} value={item.location_id}>
                {item.ikimina_name} - Cell: {item.cell}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="time-input">Time:</label>
        <input
          id="time-input"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-required="true"
          required
          disabled={loadingList || filteredIkiminaList.length === 0}
        />
      </div>

      <div className="form-buttons">
        <button
          type="submit"
          disabled={
            saving || loadingList || !selectedIkiminaId || !time || filteredIkiminaList.length === 0
          }
        >
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
