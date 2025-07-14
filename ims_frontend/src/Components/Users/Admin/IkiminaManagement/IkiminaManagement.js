import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import '../../../CSS/IkiminaManagement.css';

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
  const [numberOfEvents, setNumberOfEvents] = useState('');

  // User input
  const [ikiEmail, setIkiEmail] = useState('');
  const [ikiUsername, setIkiUsername] = useState('');
  const [ikiPassword, setIkiPassword] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Get logged-in admin sad_id from localStorage
  const getSadId = () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      const user = JSON.parse(storedUser);
      return user?.sad_id || user?.id || null;
    } catch {
      return null;
    }
  };

  // Fetch ikimina locations and frequency categories
  useEffect(() => {
    const fetchData = async () => {
      const sad_id = getSadId();
      if (!sad_id) {
        setError('User not logged in or session expired. Please login again.');
        return;
      }
      try {
        const [ikiminaRes, freqRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/locationManagerRoutes/selectAvailableIkimina?sad_id=${sad_id}`, {
            headers: { 'x-sad-id': sad_id },
          }),
          axios.get(`http://localhost:5000/api/frequencyCategoryRoutes/selectCategories?sad_id=${sad_id}`, {
            headers: { 'x-sad-id': sad_id },
          }),
        ]);
        setIkiminaList(ikiminaRes.data);
        setFreqCategories(freqRes.data);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error(err.response || err.message);
      }
    };
    fetchData();
  }, []);

  // Helper: get frequency category name from f_id
  const getCategoryName = (f_id) => {
    const cat = freqCategories.find((c) => c.f_id === f_id);
    return cat ? cat.f_category : '';
  };

  // Map ikimina locations to options for react-select, use location_id as value
  const ikiminaOptions = ikiminaList.map((item) => ({
    value: item.location_id,
    label: `${item.ikimina_name} (Cell: ${item.cell}, Village: ${item.village}) - Category: ${getCategoryName(item.f_id)}`,
    data: item,
  }));

  // When selected Ikimina changes, auto-fill fields & fetch schedule
  useEffect(() => {
    if (!selectedIkimina) {
      setIkiId('');
      setIkiName('');
      setIkiLocation('');
      setCategoryOfEvent('');
      setDayOfEvent('');
      setTimeOfEvent('');
      setNumberOfEvents('');
      return;
    }

    const ikimina = selectedIkimina.data;
    setIkiId(ikimina.location_id);
    setIkiName(ikimina.ikimina_name);
    setIkiLocation(`${ikimina.cell}, ${ikimina.village}`);
    setCategoryOfEvent(getCategoryName(ikimina.f_id));

    const fetchSchedule = async () => {
      const sad_id = getSadId();
      if (!sad_id) return;

      const frequency = getCategoryName(ikimina.f_id).toLowerCase();
      const ikiminaName = ikimina.ikimina_name;

      console.log('Fetching schedule for:', { frequency, ikiminaName, sad_id });

      try {
        const res = await axios.get(`http://localhost:5000/api/ScheduleManagerRoutes/eventTimes`, {
          headers: { 'x-sad-id': sad_id },
          params: { frequency, ikimina_name: ikiminaName },
        });

        console.log('Schedule data received:', res.data);

        if (res.data.length > 0) {
          if (frequency === 'daily') {
            // For daily, backend returns dtime_time
            setDayOfEvent('Daily');
            setTimeOfEvent(res.data[0]?.time || res.data[0]?.dtime_time || 'N/A');
            setNumberOfEvents('1');
          } else if (frequency === 'weekly') {
            // Weekly has weeklytime_day and weeklytime_time
            const allDays = res.data.map(ev => ev.day || ev.weeklytime_day).filter(Boolean);
            const allTimes = res.data.map(ev => ev.time || ev.weeklytime_time).filter(Boolean);
            const uniqueDays = [...new Set(allDays)];
            const uniqueTimes = [...new Set(allTimes)];

            setDayOfEvent(uniqueDays.length ? uniqueDays.join(', ') : 'N/A');
            setTimeOfEvent(uniqueTimes.length ? uniqueTimes.join(', ') : 'N/A');
            setNumberOfEvents(String(uniqueDays.length));
          } else if (frequency === 'monthly') {
            // Monthly has monthlytime_date and monthlytime_time
            const allDates = res.data.map(ev => ev.day || ev.monthlytime_date).filter(Boolean);
            const allTimes = res.data.map(ev => ev.time || ev.monthlytime_time).filter(Boolean);
            const uniqueDates = [...new Set(allDates)];
            const uniqueTimes = [...new Set(allTimes)];

            setDayOfEvent(uniqueDates.length ? uniqueDates.join(', ') : 'N/A');
            setTimeOfEvent(uniqueTimes.length ? uniqueTimes.join(', ') : 'N/A');
            setNumberOfEvents(String(uniqueDates.length));
          } else {
            setDayOfEvent('N/A');
            setTimeOfEvent('N/A');
            setNumberOfEvents('0');
          }
        } else {
          setDayOfEvent('N/A');
          setTimeOfEvent('N/A');
          setNumberOfEvents('0');
        }
      } catch (err) {
        setDayOfEvent('N/A');
        setTimeOfEvent('N/A');
        setNumberOfEvents('0');
        console.error('Error fetching schedule:', err);
      }
    };

    fetchSchedule();
  }, [selectedIkimina, freqCategories]);

  // Reset form fields
  const clearForm = () => {
    setSelectedIkimina(null);
    setIkiId('');
    setIkiName('');
    setIkiLocation('');
    setCategoryOfEvent('');
    setDayOfEvent('');
    setTimeOfEvent('');
    setIkiEmail('');
    setIkiUsername('');
    setIkiPassword('');
    setNumberOfEvents('');
    setSuccess(false);
    setError('');
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    if (!ikiName || !ikiEmail || !ikiUsername || !ikiPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      const sad_id = getSadId();
      if (!sad_id) {
        setError('User not logged in.');
        setSaving(false);
        return;
      }

      const payload = {
        iki_name: ikiName,
        iki_email: ikiEmail,
        iki_username: ikiUsername,
        iki_password: ikiPassword,
        iki_location: ikiId, // location_id
        dayOfEvent,
        timeOfEvent,
        f_id: selectedIkimina?.data?.f_id,
        numberOfEvents: Number(numberOfEvents),
        sad_id,
      };

      console.log('Submitting Ikimina creation payload:', payload);

      await axios.post('http://localhost:5000/api/ikiminaInfoRoutes/newIkimina', payload, {
        headers: { 'x-sad-id': sad_id },
      });

      setSuccess(true);
      clearForm();
      if (onClose) onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create Ikimina info.');
      console.error('Error creating Ikimina info:', err.response || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Create Ikimina Info</h2>

      <label>Ikimina Name (Searchable):</label>
      <Select
        options={ikiminaOptions}
        value={selectedIkimina}
        onChange={setSelectedIkimina}
        placeholder="Select Ikimina location..."
        isClearable
        isSearchable
        classNamePrefix="react-select"
      />

      <label>Ikimina ID (Auto):</label>
      <input type="text" value={ikiId} readOnly className="readonly-input" />

      <label>Ikimina Location (Auto):</label>
      <input type="text" value={ikiLocation} readOnly className="readonly-input" />

      <label>Category of Event (Auto):</label>
      <input type="text" value={categoryOfEvent} readOnly className="readonly-input" />

      <label>Day of Event (Auto):</label>
      <input type="text" value={dayOfEvent} readOnly className="readonly-input" />

      <label>Time of Event (Auto):</label>
      <input type="text" value={timeOfEvent} readOnly className="readonly-input" />

      <label>Number of Events (Auto):</label>
      <input type="text" value={numberOfEvents} readOnly className="readonly-input" />

      <label>Ikimina Email:</label>
      <input
        type="email"
        value={ikiEmail}
        onChange={(e) => setIkiEmail(e.target.value)}
        required
        placeholder="Enter Ikimina email"
      />

      <label>Ikimina Username:</label>
      <input
        type="text"
        value={ikiUsername}
        onChange={(e) => setIkiUsername(e.target.value)}
        required
        placeholder="Enter Ikimina username"
      />

      <label>Ikimina Password:</label>
      <input
        type="password"
        value={ikiPassword}
        onChange={(e) => setIkiPassword(e.target.value)}
        required
        minLength={5}
        placeholder="Enter password (min 5 characters)"
      />

      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Create Ikimina Info'}
        </button>
        <a href="/AllIkiminaPage" className="btn-back-home">Back</a>
      </div>

      {success && <div className="toast-success">Ikimina info created successfully!</div>}
      {error && <div className="toast-error">{error}</div>}
    </form>
  );
}
