import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

export default function IkiminaInfoForm({ onClose }) {
  const [ikiminaList, setIkiminaList] = useState([]);
  const [freqCategories, setFreqCategories] = useState([]);
  const [selectedIkimina, setSelectedIkimina] = useState(null);

  // Auto-filled from selected Ikimina
  const [ikiId, setIkiId] = useState('');
  const [ikiName, setIkiName] = useState('');
  const [ikiLocation, setIkiLocation] = useState('');
  const [categoryOfEvent, setCategoryOfEvent] = useState('');
  const [dayOfEvent, setDayOfEvent] = useState('');
  const [timeOfEvent, setTimeOfEvent] = useState('');

  // User input
  const [ikiEmail, setIkiEmail] = useState('');
  const [ikiUsername, setIkiUsername] = useState('');
  const [ikiPassword, setIkiPassword] = useState('');

  const [saving, setSaving] = useState(false);

  // Get sad_id from localStorage safely
  const getSadId = () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      const user = JSON.parse(storedUser);
      // Your backend might use 'id' or 'sad_id'; adjust if needed
      return user?.sad_id || user?.id || null;
    } catch {
      return null;
    }
  };

  // Fetch Ikimina locations and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      const sad_id = getSadId();
      if (!sad_id) {
        alert('User not logged in or session expired. Please login again.');
        return;
      }

      try {
        const [ikiminaRes, freqRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/LocationManagerRoutes/select?sad_id=${sad_id}`, {
            headers: { 'x-sad-id': sad_id }
          }),
          axios.get(`http://localhost:5000/api/frequencyCategory/selectCategories?sad_id=${sad_id}`, {
            headers: { 'x-sad-id': sad_id }
          })
        ]);

        setIkiminaList(ikiminaRes.data);
        setFreqCategories(freqRes.data);
      } catch (error) {
        console.error('Failed to load data:', error.response || error.message);
        alert('Failed to load data. Please try again later.');
      }
    };

    fetchData();
  }, []);

  // Helper to get category name from f_id
  const getCategoryName = (f_id) => {
    const cat = freqCategories.find(c => c.f_id === f_id);
    return cat ? cat.f_category : '';
  };

  // Prepare options for react-select with concatenated label
  const ikiminaOptions = ikiminaList.map(item => ({
    value: item.id || item.ikimina_id, // Use id or ikimina_id depending on API response
    label: `${item.ikimina_name} (Cell: ${item.cell}, Village: ${item.village}) - Category: ${getCategoryName(item.f_id)}`,
    data: item
  }));

  // When user selects an Ikimina, update auto-filled fields and fetch schedule
  useEffect(() => {
    if (!selectedIkimina) {
      setIkiId('');
      setIkiName('');
      setIkiLocation('');
      setCategoryOfEvent('');
      setDayOfEvent('');
      setTimeOfEvent('');
      return;
    }

    const ikimina = selectedIkimina.data;
    setIkiId(ikimina.id || ikimina.ikimina_id);
    setIkiName(ikimina.ikimina_name); // clean name only
    setIkiLocation(`${ikimina.cell}, ${ikimina.village}`);
    setCategoryOfEvent(getCategoryName(ikimina.f_id));

    // Fetch schedules for the selected Ikimina
    const fetchSchedule = async () => {
      const sad_id = getSadId();
      if (!sad_id) {
        alert('User not logged in or session expired. Please login again.');
        return;
      }
      try {
        const res = await axios.get(
          `http://localhost:5000/api/ScheduleManagerRoutes/allSchedules?ikimina_id=${ikimina.ikimina_id}`,
          {
            headers: { 'x-sad-id': sad_id }
          }
        );

        if (res.data && res.data.length > 0) {
          // Pick first schedule for simplicity
          const firstSchedule = res.data[0];

          // Detect schedule type explicitly and set day/time accordingly
          if ('dtime_time' in firstSchedule) {
            // Daily schedule
            setDayOfEvent('Daily');
            setTimeOfEvent(firstSchedule.dtime_time || '');
          } else if ('weeklytime_day' in firstSchedule) {
            // Weekly schedule
            setDayOfEvent(firstSchedule.weeklytime_day || '');
            setTimeOfEvent(firstSchedule.weeklytime_time || '');
          } else if ('monthlytime_date' in firstSchedule) {
            // Monthly schedule
            setDayOfEvent(firstSchedule.monthlytime_date || '');
            setTimeOfEvent(firstSchedule.monthlytime_time || '');
          } else {
            // Unknown format fallback
            setDayOfEvent('');
            setTimeOfEvent('');
          }
        } else {
          setDayOfEvent('');
          setTimeOfEvent('');
        }
      } catch (err) {
        console.error('Failed to fetch schedule:', err.response || err.message);
        setDayOfEvent('');
        setTimeOfEvent('');
      }
    };

    fetchSchedule();
  }, [selectedIkimina, freqCategories]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ikiName || !ikiEmail || !ikiUsername || !ikiPassword) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const sad_id = getSadId();
      if (!sad_id) {
        alert('User not logged in');
        setSaving(false);
        return;
      }

      const payload = {
        iki_name: ikiName,
        iki_email: ikiEmail,
        iki_username: ikiUsername,
        iki_password: ikiPassword,
        iki_location: ikiLocation,
        CategoryOfEvent: categoryOfEvent,
        dayOfEvent: dayOfEvent,
        timeOfEvent: timeOfEvent,
      };

      await axios.post('http://localhost:5000/api/ikimina_info/create', payload, {
        headers: { 'x-sad-id': sad_id }
      });

      alert('Ikimina info created successfully');
      if (onClose) onClose();

    } catch (error) {
      console.error('Error creating Ikimina info:', error.response || error.message);
      alert(error?.response?.data?.message || 'Failed to create Ikimina info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ maxWidth: '600px', margin: 'auto' }}>
      <h2>Create Ikimina Info</h2>

      <label>Ikimina Name (Searchable):</label>
      <Select
        options={ikiminaOptions}
        value={selectedIkimina}
        onChange={setSelectedIkimina}
        placeholder="Select Ikimina location..."
        isClearable
        isSearchable
      />

      <label>Ikimina ID (Auto):</label>
      <input type="text" value={ikiId} readOnly />

      <label>Ikimina Location (Auto):</label>
      <input type="text" value={ikiLocation} readOnly />

      <label>Category of Event (Auto):</label>
      <input type="text" value={categoryOfEvent} readOnly />

      <label>Day of Event (Auto):</label>
      <input type="text" value={dayOfEvent} readOnly />

      <label>Time of Event (Auto):</label>
      <input type="text" value={timeOfEvent} readOnly />

      <label>Ikimina Email:</label>
      <input
        type="email"
        value={ikiEmail}
        onChange={e => setIkiEmail(e.target.value)}
        required
      />

      <label>Ikimina Username:</label>
      <input
        type="text"
        value={ikiUsername}
        onChange={e => setIkiUsername(e.target.value)}
        required
      />

      <label>Ikimina Password:</label>
      <input
        type="password"
        value={ikiPassword}
        onChange={e => setIkiPassword(e.target.value)}
        required
        minLength={5}
      />

      <div style={{ marginTop: '20px' }}>
        <button type="submit" disabled={saving} style={{ marginRight: '10px' }}>
          {saving ? 'Saving...' : 'Create Ikimina Info'}
        </button>
        <button type="button" onClick={onClose} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
