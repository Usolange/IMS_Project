// Updated MonthlyScheduleForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

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

  // Build select options (with location_id)
  const ikiminaOptions = filteredIkiminaList.map(item => ({
    value: item.location_id.toString(),
    label: `${item.ikimina_name} - Cell: ${item.cell}`,
    ikimina_name: item.ikimina_name,
  }));

  const dayOptions = Array.from({ length: 31 }, (_, i) => {
    const dayStr = (i + 1).toString().padStart(2, '0');
    return { value: dayStr, label: dayStr };
  });

  const handleIkiminaChange = (selectedOption) => {
    if (selectedOption) {
      setSelectedIkiminaId(selectedOption.value);
      setSelectedIkiminaName(selectedOption.ikimina_name);
    } else {
      setSelectedIkiminaId('');
      setSelectedIkiminaName('');
    }
  };

  const handleDaysChange = (selectedOptions) => {
    setSelectedDates(selectedOptions ? selectedOptions.map(opt => opt.value) : []);
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
          location_id: selectedIkiminaId,
          ikimina_name: selectedIkiminaName,
          selected_dates: selectedDates,
          mtime_time: time,
          f_id,
        },
        {
          headers: { 'x-sad-id': user.id },
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

  return (
    <form onSubmit={handleSubmit} className="schedule-form">
      <div className="form-group">
        <label>Ikimina:</label>
        <Select
          options={ikiminaOptions}
          onChange={handleIkiminaChange}
          isClearable
          placeholder="Search and select Ikimina"
          value={ikiminaOptions.find(opt => opt.value === selectedIkiminaId) || null}
        />
      </div>

      <div className="form-group">
        <label>Dates of the Month:</label>
        <Select
          options={dayOptions}
          onChange={handleDaysChange}
          isMulti
          placeholder="Select one or more dates"
          value={dayOptions.filter(opt => selectedDates.includes(opt.value))}
          closeMenuOnSelect={false}
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
        <button
          type="submit"
          disabled={saving || !selectedIkiminaId || selectedDates.length === 0 || !time}
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

export default MonthlyScheduleForm;
