import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import '../../../CSS/IkiminaManagement.css';

export default function IkiminaInfoForm({ onClose }) {
  const [ikiminaList, setIkiminaList] = useState([]);
  const [freqCategories, setFreqCategories] = useState([]);
  const [selectedIkimina, setSelectedIkimina] = useState(null);

  const [ikiId, setIkiId] = useState('');
  const [ikiName, setIkiName] = useState('');
  const [ikiLocation, setIkiLocation] = useState('');
  const [categoryOfEvent, setCategoryOfEvent] = useState('');
  const [dayOfEvent, setDayOfEvent] = useState('');
  const [timeOfEvent, setTimeOfEvent] = useState('');
  const [numberOfEvents, setNumberOfEvents] = useState('');

  const [ikiEmail, setIkiEmail] = useState('');
  const [ikiUsername, setIkiUsername] = useState('');
  const [ikiPassword, setIkiPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 🔐 Get current admin ID
  const getSadId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.sad_id || user?.id || null;
    } catch {
      return null;
    }
  };

  // 🚀 Load available Ikimina & frequency categories
  useEffect(() => {
    const sad_id = getSadId();
    if (!sad_id) {
      setError('User not logged in. Please login again.');
      return;
    }

    const fetchData = async () => {
      try {
        const [ikiminaRes, freqRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/locationManagerRoutes/selectAvailableIkimina?sad_id=${sad_id}`),
          axios.get(`http://localhost:5000/api/frequencyCategoryRoutes/selectCategories?sad_id=${sad_id}`)
        ]);

        setIkiminaList(ikiminaRes.data);
        setFreqCategories(freqRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch Ikimina or category data.');
      }
    };

    fetchData();
  }, []);

  const getCategoryName = (f_id) => {
    const found = freqCategories.find(c => c.f_id === f_id);
    return found ? found.f_category : '';
  };

  const ikiminaOptions = ikiminaList.map(item => ({
    value: item.ikimina_id,
    label: `${item.ikimina_name} (Cell: ${item.cell}, Village: ${item.village}) - ${getCategoryName(item.f_id)}`,
    data: item
  }));

  // 🧠 Auto-fill when ikimina is selected
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
    const f_id = ikimina.f_id;
    const frequency = getCategoryName(f_id).toLowerCase();

    setIkiId(ikimina.ikimina_id);
    setIkiName(ikimina.ikimina_name);
    setIkiLocation(`${ikimina.cell}, ${ikimina.village}`);
    setCategoryOfEvent(getCategoryName(f_id));

    const sad_id = getSadId();
    if (!sad_id) return;

    // Fetch schedule info from frequency table
    const fetchSchedule = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/ScheduleManagerRoutes/eventTimes`, {
          headers: { 'x-sad-id': sad_id },
          params: { frequency, ikimina_name: ikimina.ikimina_name }
        });

        if (res.data.length > 0) {
          if (frequency === 'daily') {
            setDayOfEvent('Daily');
            setTimeOfEvent(res.data[0].time || '');
            setNumberOfEvents('1');
          } else {
            const days = [...new Set(res.data.map(ev => ev.day))];
            const times = [...new Set(res.data.map(ev => ev.time))];

            setDayOfEvent(days.join(', '));
            setTimeOfEvent(times.join(', '));
            setNumberOfEvents(String(days.length));
          }
        } else {
          setDayOfEvent('N/A');
          setTimeOfEvent('N/A');
          setNumberOfEvents('0');
        }
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
        setDayOfEvent('N/A');
        setTimeOfEvent('N/A');
        setNumberOfEvents('0');
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
    setNumberOfEvents('');
    setIkiEmail('');
    setIkiUsername('');
    setIkiPassword('');
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    if (!ikiName || !ikiEmail || !ikiUsername || !ikiPassword || !selectedIkimina) {
      setError('All required fields must be filled.');
      return;
    }

    const sad_id = getSadId();
    if (!sad_id) {
      setError('Unauthorized. Please login again.');
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
      f_id: selectedIkimina.data.f_id,
      numberOfEvents: Number(numberOfEvents),
      sad_id,
    };

    try {
      await axios.post(`http://localhost:5000/api/ikiminaInfoRoutes/newIkimina`, payload, {
        headers: { 'x-sad-id': sad_id },
      });

      setSuccess(true);
      clearForm();
      if (onClose) onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Creation failed.';
      if (msg.includes('already exists')) {
        setError('Email or username already exists.');
      } else if (msg.includes('Invalid Ikimina')) {
        setError('Selected Ikimina does not belong to your account.');
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Create Ikimina Info</h2>

      <label>Select Ikimina:</label>
      <Select
        options={ikiminaOptions}
        value={selectedIkimina}
        onChange={setSelectedIkimina}
        placeholder="Search for Ikimina location..."
        isClearable
        classNamePrefix="react-select"
      />

      <label>Ikimina ID:</label>
      <input type="text" value={ikiId} readOnly className="readonly-input" />

      <label>Ikimina Location:</label>
      <input type="text" value={ikiLocation} readOnly className="readonly-input" />

      <label>Category of Event:</label>
      <input type="text" value={categoryOfEvent} readOnly className="readonly-input" />

      <label>Day(s) of Event:</label>
      <input type="text" value={dayOfEvent} readOnly className="readonly-input" />

      <label>Time of Event:</label>
      <input type="text" value={timeOfEvent} readOnly className="readonly-input" />

      <label>Number of Events:</label>
      <input type="text" value={numberOfEvents} readOnly className="readonly-input" />

      <label>Email:</label>
      <input
        type="email"
        value={ikiEmail}
        onChange={(e) => setIkiEmail(e.target.value)}
        required
        placeholder="example@email.com"
      />

      <label>Username:</label>
      <input
        type="text"
        value={ikiUsername}
        onChange={(e) => setIkiUsername(e.target.value)}
        required
        placeholder="Enter username"
      />

      <label>Password:</label>
      <input
        type="password"
        value={ikiPassword}
        onChange={(e) => setIkiPassword(e.target.value)}
        required
        placeholder="Minimum 5 characters"
        minLength={5}
      />

      <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Create Ikimina'}
        </button>
        <a href="/AllIkiminaPage" className="btn-back-home">Back</a>
      </div>

      {success && <div className="toast-success">Ikimina created successfully!</div>}
      {error && <div className="toast-error">{error}</div>}
    </form>
  );
}
