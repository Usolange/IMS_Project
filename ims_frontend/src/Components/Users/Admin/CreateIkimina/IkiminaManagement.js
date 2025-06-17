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

  useEffect(() => {
    const fetchData = async () => {
      const sad_id = getSadId();
      if (!sad_id) {
        setError('User not logged in or session expired. Please login again.');
        return;
      }
      try {
        const [ikiminaRes, freqRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/LocationManagerRoutes/selectAvailableIkimina?sad_id=${sad_id}`, {
            headers: { 'x-sad-id': sad_id },
          }),
          axios.get(`http://localhost:5000/api/frequencyCategory/selectCategories?sad_id=${sad_id}`, {
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

  const getCategoryName = (f_id) => {
    const cat = freqCategories.find((c) => c.f_id === f_id);
    return cat ? cat.f_category : '';
  };

  const ikiminaOptions = ikiminaList.map((item) => ({
    value: item.id || item.ikimina_id,
    label: `${item.ikimina_name} (Cell: ${item.cell}, Village: ${item.village}) - Category: ${getCategoryName(item.f_id)}`,
    data: item,
  }));

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
    setIkiId(ikimina.id || ikimina.ikimina_id);
    setIkiName(ikimina.ikimina_name);
    setIkiLocation(`${ikimina.cell}, ${ikimina.village}`);
    setCategoryOfEvent(getCategoryName(ikimina.f_id));

    const fetchSchedule = async () => {
      const sad_id = getSadId();
      if (!sad_id) return;

      const ikiminaName = ikimina.ikimina_name;
      const f_id = ikimina.f_id;
      const frequency = getCategoryName(f_id).toLowerCase();

      try {
        const res = await axios.get(`http://localhost:5000/api/ScheduleManagerRoutes/eventTimes`, {
          headers: { 'x-sad-id': sad_id },
          params: { frequency, ikimina_name: ikiminaName },
        });

        if (res.data.length > 0) {
          if (frequency === 'daily') {
            setDayOfEvent('Daily');
            setTimeOfEvent(res.data[0].time || '');
            setNumberOfEvents('1');
          } else {
            const allDays = res.data.map(ev => ev.day);
            const allTimes = res.data.map(ev => ev.time);
            const uniqueDays = [...new Set(allDays)];
            const uniqueTimes = [...new Set(allTimes)];

            setDayOfEvent(uniqueDays.join(', '));
            setTimeOfEvent(uniqueTimes.join(', '));
            setNumberOfEvents(String(uniqueDays.length));
          }
        } else {
          setDayOfEvent('N/A');
          setTimeOfEvent('N/A');
          setNumberOfEvents('0');
        }
      } catch (err) {
        setDayOfEvent('N/A');
        setTimeOfEvent('N/A');
        console.error('Error fetching schedule:', err);
      }
    };

    fetchSchedule();
  }, [selectedIkimina, freqCategories]);

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
        iki_location: ikiId,
        dayOfEvent,
        timeOfEvent,
        f_id: selectedIkimina?.data?.f_id,
        numberOfEvents: Number(numberOfEvents),
        sad_id,
      };

      console.log('Submitting Ikimina creation payload:', payload);

      await axios.post('http://localhost:5000/api/ikiminaInfo/create', payload, {
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
