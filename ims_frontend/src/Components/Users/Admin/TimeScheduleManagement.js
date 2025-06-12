import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import '../../CSS/TimeScheduleManagement.css';
import AddCategoryModal from './AddCategoryModal'; // Adjust path as needed

export default function TimeScheduleManagement() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [frequencies, setFrequencies] = useState([]);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [ikiminaName, setIkiminaName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [allSchedules, setAllSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser?.id) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      setUser(storedUser);
    } catch {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  // Fetch frequency categories for logged-in user
  const fetchFrequencies = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await axios.get('/api/frequencyCategory/selectCategories', {
        headers: { 'x-sad-id': user.id.toString() },
      });

      const sortedOptions = res.data
        .sort((a, b) => a.f_category.localeCompare(b.f_category))
        .map((cat) => ({
          value: cat.f_id,
          label: cat.f_category,
          f_id: cat.f_id,
          f_category: cat.f_category,
          sad_id: cat.sad_id,
        }));

      setFrequencies(sortedOptions);
      setMessage('');
    } catch (error) {
      setMessage('⚠️ Failed to load frequency categories. Please try again later.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch schedules from backend for the logged-in user
  const fetchSchedules = async () => {
    if (!user?.id) return;

    setLoadingSchedules(true);
    try {
      const headers = { 'x-sad-id': user.id.toString() };

      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        axios.get('/api/ikDailyTime/daily', { headers }),
        axios.get('/api/ikWeeklyTime/weekly', { headers }),
        axios.get('/api/ikMonthlyTime/monthly', { headers }),
      ]);

      const dailySchedules = dailyRes.data.map(item => ({
        id: item.dtime_id,
        ikimina_name: item.ikimina_name,
        category: 'Daily',
        days_or_dates: '-',
        time: item.dtime_time,
      }));

      const weeklySchedules = weeklyRes.data.map(item => ({
        id: item.wtime_id,
        ikimina_name: item.ikimina_name,
        category: 'Weekly',
        days_or_dates: item.wtime_days,
        time: item.wtime_time,
      }));

      const monthlySchedules = monthlyRes.data.map(item => ({
        id: item.mtime_id,
        ikimina_name: item.ikimina_name,
        category: 'Monthly',
        days_or_dates: item.mtime_days,
        time: item.mtime_time,
      }));

      const combined = [...dailySchedules, ...weeklySchedules, ...monthlySchedules];
      const order = { Daily: 1, Weekly: 2, Monthly: 3 };

      combined.sort((a, b) => {
        if (order[a.category] !== order[b.category]) {
          return order[a.category] - order[b.category];
        }
        return a.time.localeCompare(b.time);
      });

      setAllSchedules(combined);
      setMessage('');
    } catch (error) {
      setAllSchedules([]);
      setMessage('⚠️ Failed to load schedules.');
      console.error('fetchSchedules error:', error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Load frequencies and schedules after user is set
  useEffect(() => {
    if (user) {
      fetchFrequencies();
      fetchSchedules();
    }
  }, [user]);

  // Clear message and reset days on frequency change
  useEffect(() => {
    setMessage('');
    setSelectedDays([]);
  }, [selectedFrequency]);

  // Handle frequency category selection
  const handleFrequencyChange = (option) => {
    setSelectedFrequency(option);
    setMessage('');
  };

  // Handle adding a new category from modal
  const handleCategoryAdded = (newCategory) => {
    setFrequencies((prev) =>
      [...prev, newCategory].sort((a, b) => a.label.localeCompare(b.label))
    );
    setSelectedFrequency(newCategory);
  };

  // Weekly and Monthly selectors data
  const weeklyDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthlyDates = Array.from({ length: 31 }, (_, i) => i + 1);

  // Toggle days or dates for weekly/monthly
  const handleDayToggle = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Render day/date selectors based on selected frequency
  const renderDaysSelector = () => {
    if (!selectedFrequency) return null;
    const freqLower = selectedFrequency.label.toLowerCase();

    if (freqLower === 'weekly') {
      return (
        <div className="days-selector">
          <label>Select days of the week:</label>
          <div className="checkbox-group">
            {weeklyDays.map((day) => (
              <label key={day}>
                <input
                  type="checkbox"
                  value={day}
                  checked={selectedDays.includes(day)}
                  onChange={() => handleDayToggle(day)}
                  disabled={loading}
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (freqLower === 'monthly') {
      return (
        <div className="days-selector">
          <label>Select dates of the month:</label>
          <div className="checkbox-group monthly">
            {monthlyDates.map((date) => (
              <label key={date}>
                <input
                  type="checkbox"
                  value={date}
                  checked={selectedDays.includes(date)}
                  onChange={() => handleDayToggle(date)}
                  disabled={loading}
                />
                {date}
              </label>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // Handle form submission for new schedule
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!user?.id) return;

    if (!ikiminaName.trim()) {
      setMessage('❌ Please enter the Ikimina Name.');
      return;
    }
    if (!selectedFrequency) {
      setMessage('❌ Please select a frequency category.');
      return;
    }
    if (!selectedTime) {
      setMessage('❌ Please select a time.');
      return;
    }

    const freqCatLower = selectedFrequency.label.toLowerCase();

    if ((freqCatLower === 'weekly' || freqCatLower === 'monthly') && selectedDays.length === 0) {
      setMessage(
        freqCatLower === 'weekly'
          ? '❌ Please select at least one day of the week.'
          : '❌ Please select at least one date.'
      );
      return;
    }

    setLoading(true);
    try {
      let scheduleData = {};
      scheduleData.f_id = selectedFrequency.value;

      if (freqCatLower === 'daily') {
        scheduleData = {
          ...scheduleData,
          ikimina_name: ikiminaName.trim(),
          dtime_time: selectedTime.toTimeString().slice(0, 5),
        };
      } else if (freqCatLower === 'weekly') {
        scheduleData = {
          ...scheduleData,
          ikimina_name: ikiminaName.trim(),
          weeklytime_days: selectedDays,
          weeklytime_time: selectedTime.toTimeString().slice(0, 5),
        };
      } else if (freqCatLower === 'monthly') {
        scheduleData = {
          ...scheduleData,
          ikimina_name: ikiminaName.trim(),
          monthlytime_dates: selectedDays,
          monthlytime_time: selectedTime.toTimeString().slice(0, 5),
        };
      } else {
        setMessage('❌ Unknown frequency category.');
        setLoading(false);
        return;
      }

      const headers = { 'x-sad-id': user.id.toString() };

      if (freqCatLower === 'daily') {
        await axios.post('/api/ikDailyTime/newDaily', scheduleData, { headers });
      } else if (freqCatLower === 'weekly') {
        await axios.post('/api/ikWeeklyTime/newWeekly', scheduleData, { headers });
      } else if (freqCatLower === 'monthly') {
        await axios.post('/api/ikMonthlyTime/newMonthly', scheduleData, { headers });
      }

      setMessage('✅ Schedule saved successfully!');
      setIkiminaName('');
      setSelectedFrequency(null);
      setSelectedDays([]);
      setSelectedTime(null);

      fetchSchedules(); // refresh schedules
    } catch (error) {
      setMessage('❌ Failed to save schedule. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="time-schedule-management">
      <h2>Time Schedule Management</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="ikiminaName">Ikimina Name:</label>
          <input
            id="ikiminaName"
            type="text"
            placeholder="Enter Ikimina Name"
            value={ikiminaName}
            onChange={(e) => setIkiminaName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Frequency Category:</label>
          <Select
            options={frequencies}
            onChange={handleFrequencyChange}
            value={selectedFrequency}
            isDisabled={loading}
            placeholder="Select Frequency"
            getOptionLabel={(e) => e.label}
            getOptionValue={(e) => e.value}
            noOptionsMessage={() => 'No categories found'}
          />
          <button
            type="button"
            className="btn-add-category"
            onClick={() => setModalOpen(true)}
            disabled={loading}
          >
            + Add Category
          </button>
        </div>

        {renderDaysSelector()}

        <div className="form-group">
          <label>Select Time:</label>
          <DatePicker
            selected={selectedTime}
            onChange={(time) => setSelectedTime(time)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="HH:mm"
            placeholderText="Select Time"
            disabled={loading}
          />
        </div>

        {message && <p className="message">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Schedule'}
        </button>
      </form>

      <hr />

      <h3>All Schedules</h3>
      {loadingSchedules ? (
        <p>Loading schedules...</p>
      ) : allSchedules.length === 0 ? (
        <p>No schedules found.</p>
      ) : (
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Ikimina Name</th>
              <th>Frequency</th>
              <th>Days/Dates</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {allSchedules.map((schedule) => (
              <tr key={schedule.id}>
                <td>{schedule.ikimina_name}</td>
                <td>{schedule.category}</td>
                <td>{schedule.days_or_dates}</td>
                <td>{schedule.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <AddCategoryModal
          onClose={() => setModalOpen(false)}
          onCategoryAdded={handleCategoryAdded}
          userId={user?.id}
        />
      )}
    </div>
  );
}
