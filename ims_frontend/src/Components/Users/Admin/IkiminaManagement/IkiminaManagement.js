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
  const [weeklySavingDays, setWeeklySavingDays] = useState([]);
  const [monthlySavingDays, setMonthlySavingDays] = useState([]);

  const [ikiEmail, setIkiEmail] = useState('');
  const [ikiUsername, setIkiUsername] = useState('');
  const [ikiPassword, setIkiPassword] = useState('');

  const [loading, setLoading] = useState(false);
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

      setLoading(true);
      setError('');
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryName = (f_id) => {
    const cat = freqCategories.find((c) => c.f_id === f_id);
    return cat ? cat.f_category : '';
  };

  const ikiminaOptions = ikiminaList.map((item) => ({
    value: item.location_id,
    label: `${item.ikimina_name} (Cell: ${item.cell}, Village: ${item.village}) - Category: ${getCategoryName(item.f_id)}`,
    data: item,
  }));

  useEffect(() => {
    if (!selectedIkimina) {
      clearFormAutoFields();
      return;
    }

    const ikimina = selectedIkimina.data;
    setIkiId(ikimina.location_id);
    setIkiName(ikimina.ikimina_name);
    setIkiLocation(`${ikimina.cell}, ${ikimina.village}`);
    const categoryName = getCategoryName(ikimina.f_id);
    setCategoryOfEvent(categoryName);

    const fetchSchedule = async () => {
      const sad_id = getSadId();
      if (!sad_id) return;

      const frequency = categoryName.toLowerCase();
      const ikiminaName = ikimina.ikimina_name;

      try {
        const res = await axios.get(`http://localhost:5000/api/ScheduleManagerRoutes/eventTimes`, {
          headers: { 'x-sad-id': sad_id },
          params: { frequency, ikimina_name: ikiminaName },
        });

        if (res.data.length > 0) {
          if (frequency === 'daily') {
            setDayOfEvent('Daily');
            setTimeOfEvent(res.data[0]?.time || res.data[0]?.dtime_time || 'N/A');
            setNumberOfEvents('1');
            setWeeklySavingDays([]);
            setMonthlySavingDays([]);
          } else if (frequency === 'weekly') {
            const allDays = res.data.map(ev => ev.day || ev.weeklytime_day).filter(Boolean);
            const allTimes = res.data.map(ev => ev.time || ev.weeklytime_time).filter(Boolean);

            const uniqueDays = [...new Set(allDays)];
            const uniqueTimes = [...new Set(allTimes)];

            setWeeklySavingDays(uniqueDays);
            setMonthlySavingDays([]);

            setDayOfEvent(uniqueDays.join(', ') || 'N/A');
            setTimeOfEvent(uniqueTimes.join(', ') || 'N/A');
            setNumberOfEvents(String(uniqueDays.length));
          } else if (frequency === 'monthly') {
            const allDates = res.data.map(ev => ev.day || ev.monthlytime_date).filter(Boolean);
            const allTimes = res.data.map(ev => ev.time || ev.monthlytime_time).filter(Boolean);

            const uniqueDates = [...new Set(allDates)];
            const uniqueTimes = [...new Set(allTimes)];

            setMonthlySavingDays(uniqueDates);
            setWeeklySavingDays([]);

            setDayOfEvent(uniqueDates.join(', ') || 'N/A');
            setTimeOfEvent(uniqueTimes.join(', ') || 'N/A');
            setNumberOfEvents(String(uniqueDates.length));
          } else {
            clearFormAutoFields();
          }
        } else {
          clearFormAutoFields();
        }
      } catch (err) {
        clearFormAutoFields();
        console.error('Error fetching schedule:', err);
      }
    };

    fetchSchedule();
  }, [selectedIkimina, freqCategories]);

  const clearFormAutoFields = () => {
    setIkiId('');
    setIkiName('');
    setIkiLocation('');
    setCategoryOfEvent('');
    setDayOfEvent('');
    setTimeOfEvent('');
    setNumberOfEvents('');
    setWeeklySavingDays([]);
    setMonthlySavingDays([]);
  };

  const clearForm = () => {
    setSelectedIkimina(null);
    clearFormAutoFields();
    setIkiEmail('');
    setIkiUsername('');
    setIkiPassword('');
    setSuccess(false);
    setError('');
  };

  const validateForm = () => {
    if (!selectedIkimina) return 'Please select an Ikimina location.';
    if (!ikiEmail.trim()) return 'Ikimina Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ikiEmail)) return 'Please enter a valid email address.';
    if (!ikiUsername.trim()) return 'Ikimina Username is required.';
    if (ikiPassword.length < 5) return 'Password must be at least 5 characters.';
    if (!dayOfEvent || dayOfEvent === 'N/A') return 'Day of Event information is missing.';
    if (!timeOfEvent || timeOfEvent === 'N/A') return 'Time of Event information is missing.';
    if (!numberOfEvents || numberOfEvents === '0') return 'Number of Events information is missing.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const sad_id = getSadId();
    if (!sad_id) {
      setError('User not logged in.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        iki_name: ikiName,
        iki_email: ikiEmail,
        iki_username: ikiUsername,
        iki_password: ikiPassword,
        location_id: ikiId,
        dayOfEvent,
        timeOfEvent,
        f_id: selectedIkimina?.data?.f_id,
        numberOfEvents: Number(numberOfEvents),
        sad_id,
        weekly_saving_days: weeklySavingDays,
        monthly_saving_days: monthlySavingDays,
      };

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
    <form onSubmit={handleSubmit} noValidate className="ikimina-info-form">
      <h2>Create Ikimina Info</h2>

      {loading && <div className="loading">Loading data...</div>}
      {error && <div className="toast-error">{error}</div>}
      {success && <div className="toast-success">Ikimina info created successfully!</div>}

      <div className="form-row">
        <label>Ikimina Name (Searchable):</label>
        <Select
          options={ikiminaOptions}
          value={selectedIkimina}
          onChange={setSelectedIkimina}
          placeholder="Select Ikimina location..."
          isClearable
          isSearchable
          classNamePrefix="react-select"
          isDisabled={loading || saving}
        />
      </div>

      <div className="form-row">
        <label>Ikimina ID (Auto):</label>
        <input type="text" value={ikiId} readOnly className="readonly-input" disabled={loading || saving} />
      </div>
      <div className="form-row">
        <label>Ikimina Location (Auto):</label>
        <input type="text" value={ikiLocation} readOnly className="readonly-input" disabled={loading || saving} />
      </div>
      <div className="form-row">
        <label>Category of Event (Auto):</label>
        <input type="text" value={categoryOfEvent} readOnly className="readonly-input" disabled={loading || saving} />
      </div>
      <div className="form-row">
        <label>Weekly Saving Days (Auto):</label>
        <input type="text" value={weeklySavingDays.join(', ')} readOnly className="readonly-input" disabled={loading || saving} />
      </div>
      <div className="form-row">
        <label>Monthly Saving Days (Auto):</label>
        <input type="text" value={monthlySavingDays.join(', ')} readOnly className="readonly-input" disabled={loading || saving} />
      </div>
      <div className="form-row">
        <label>Day of Event (Auto):</label>
        <input type="text" value={dayOfEvent} readOnly className="readonly-input" disabled={loading || saving} />
      </div>
      <div className="form-row">
        <label>Time of Event (Auto):</label>
        <input type="text" value={timeOfEvent} readOnly className="readonly-input" disabled={loading || saving} />
      </div>
      <div className="form-row">
        <label>Number of Events (Auto):</label>
        <input type="text" value={numberOfEvents} readOnly className="readonly-input" disabled={loading || saving} />
      </div>

      <div className="form-row">
        <label>Ikimina Email:</label>
        <input
          type="email"
          value={ikiEmail}
          onChange={(e) => setIkiEmail(e.target.value)}
          required
          placeholder="Enter Ikimina email"
          disabled={loading || saving}
        />
      </div>

      <div className="form-row">
        <label>Ikimina Username:</label>
        <input
          type="text"
          value={ikiUsername}
          onChange={(e) => setIkiUsername(e.target.value)}
          required
          placeholder="Enter Ikimina username"
          disabled={loading || saving}
        />
      </div>

      <div className="form-row">
        <label>Ikimina Password:</label>
        <input
          type="password"
          value={ikiPassword}
          onChange={(e) => setIkiPassword(e.target.value)}
          required
          minLength={5}
          placeholder="Enter password (min 5 characters)"
          disabled={loading || saving}
        />
      </div>

      <div className="button-row">
        <button type="submit" disabled={saving || loading}>
          {saving ? 'Saving...' : 'Create Ikimina Info'}
        </button>
        <a href="/AllIkiminaPage" className="btn-back-home">
          Back
        </a>
      </div>
    </form>
  );
}
