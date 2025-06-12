import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import '../../CSS/TimeScheduleManagement.css';

function AddCategoryModal({
  isOpen,
  onClose,
  onAddCategory,
  loading,
  message,
  setNewCategoryName,
  newCategoryName,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Add New Frequency Category</h3>
        <input
          type="text"
          placeholder="Category name"
          value={newCategoryName}
          ref={inputRef}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="modal-input"
          disabled={loading}
        />
        {message && (
          <p className={`modal-message ${message.startsWith('✅') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-cancel" disabled={loading}>
            Cancel
          </button>
          <button onClick={onAddCategory} className="btn btn-confirm" disabled={loading}>
            {loading ? 'Adding...' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TimeScheduleManagement() {
  const navigate = useNavigate();

  const [frequencies, setFrequencies] = useState([]);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [ikiminaName, setIkiminaName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [allSchedules, setAllSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  // Get user id from localStorage or redirect to login
  const getSadId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.id) {
        localStorage.clear();
        navigate('/login');
        return null;
      }
      return user.id;
    } catch {
      localStorage.clear();
      navigate('/login');
      return null;
    }
  };

  // Fetch frequency categories from API with user ID header
  const fetchFrequencies = async () => {
    const sadId = getSadId();
    if (!sadId) return;

    setLoading(true);
    try {
      const res = await axios.get('/api/frequencyCategory/selectCategories', {
        headers: { 'x-sad-id': sadId },
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

  // Fetch schedules from 3 endpoints and merge, sort
  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        axios.get(`/api/ikDailyTime/daily`),
        axios.get(`/api/ikWeeklyTime/weekly`),
        axios.get(`/api/ikMonthlyTime/monthly`),
      ]);

      const dailySchedules = dailyRes.data.map((item) => ({
        id: item.dtime_id,
        ikimina_name: item.ikimina_name,
        category: 'Daily',
        days_or_dates: '-',
        time: item.dtime_time,
      }));

      const weeklySchedules = weeklyRes.data.map((item) => ({
        id: item.wtime_id,
        ikimina_name: item.ikimina_name,
        category: 'Weekly',
        days_or_dates: item.wtime_days,
        time: item.wtime_time,
      }));

      const monthlySchedules = monthlyRes.data.map((item) => ({
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
      console.error(error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchFrequencies();
    fetchSchedules();
  }, []);

  // Clear message on frequency change
  useEffect(() => {
    setMessage('');
    setSelectedDays([]);
  }, [selectedFrequency]);

  // Submit new or edited schedule
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const sadId = getSadId();
    if (!sadId) return;

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

      if (freqCatLower === 'daily') {
        scheduleData = {
          ikimina_name: ikiminaName.trim(),
          dtime_time: selectedTime.toTimeString().slice(0, 5),
        };
      } else if (freqCatLower === 'weekly') {
        scheduleData = {
          ikimina_name: ikiminaName.trim(),
          weeklytime_days: selectedDays,
          weeklytime_time: selectedTime.toTimeString().slice(0, 5),
        };
      } else if (freqCatLower === 'monthly') {
        scheduleData = {
          ikimina_name: ikiminaName.trim(),
          monthlytime_dates: selectedDays,
          monthlytime_time: selectedTime.toTimeString().slice(0, 5),
        };
      } else {
        setMessage('❌ Invalid frequency category selected.');
        setLoading(false);
        return;
      }

      await axios.post(
        '/api/time-schedule/setSchedule',
        {
          f_id: selectedFrequency.f_id,
          scheduleData,
        },
        {
          headers: { 'x-sad-id': sadId },
        }
      );

      setMessage('✅ Time schedule saved successfully!');
      setIkiminaName('');
      setSelectedFrequency(null);
      setSelectedDays([]);
      setSelectedTime(null);
      fetchSchedules();
    } catch (error) {
      setMessage('❌ Failed to save time schedule. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Add new category handler
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setMessage('❌ Category name is required');
      return;
    }

    const sadId = getSadId();
    if (!sadId) return;

    setLoading(true);
    try {
      const response = await axios.post(
        '/api/frequencyCategory/newCategory',
        { categoryName: newCategoryName.trim() },
        { headers: { 'x-sad-id': sadId } }
      );

      const newCat = {
        value: response.data.id,
        label: response.data.categoryName,
        f_id: response.data.id,
        f_category: response.data.categoryName,
        sad_id: sadId,
      };

      setFrequencies((prev) =>
        [...prev, newCat].sort((a, b) => a.label.localeCompare(b.label))
      );
      setNewCategoryName('');
      setModalOpen(false);
      setMessage('✅ Category added successfully!');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setMessage('❌ This category already exists.');
      } else {
        setMessage('❌ Failed to add category. Please try again.');
      }
      console.error('Error adding category:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to toggle days selection
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Helper arrays for day/date options
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const monthDates = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  return (
    <div className="time-schedule-management">
      <h2>Time Schedule Management</h2>

      <form onSubmit={handleSubmit} className="schedule-form">
        <label>
          Ikimina Name:
          <input
            type="text"
            value={ikiminaName}
            onChange={(e) => setIkiminaName(e.target.value)}
            disabled={loading}
            placeholder="Enter Ikimina name"
            required
          />
        </label>

        <label>
          Frequency Category:
          <div className="select-add-category">
            <Select
              options={frequencies}
              value={selectedFrequency}
              onChange={setSelectedFrequency}
              isDisabled={loading}
              placeholder="Select frequency category"
              getOptionLabel={(e) => (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {e.label}
                </div>
              )}
            />
            <button
              type="button"
              className="btn btn-add-category"
              onClick={() => {
                setModalOpen(true);
                setMessage('');
              }}
              disabled={loading}
            >
              + Add Category
            </button>
          </div>
        </label>

        {/* Show day/date selectors based on frequency */}
        {selectedFrequency && selectedFrequency.label.toLowerCase() === 'weekly' && (
          <fieldset className="day-selection">
            <legend>Select Days of the Week</legend>
            {weekDays.map((day) => (
              <label key={day} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day)}
                  onChange={() => toggleDay(day)}
                  disabled={loading}
                />
                {day}
              </label>
            ))}
          </fieldset>
        )}

        {selectedFrequency && selectedFrequency.label.toLowerCase() === 'monthly' && (
          <fieldset className="day-selection">
            <legend>Select Dates of the Month</legend>
            <div className="date-grid">
              {monthDates.map((date) => (
                <label key={date} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(date)}
                    onChange={() => toggleDay(date)}
                    disabled={loading}
                  />
                  {date}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <label>
          Time:
          <DatePicker
            selected={selectedTime}
            onChange={setSelectedTime}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="HH:mm"
            disabled={loading}
            placeholderText="Select time"
            required
          />
        </label>

        {message && (
          <p className={`form-message ${message.startsWith('✅') ? 'success' : 'error'}`}>{message}</p>
        )}

        <button type="submit" disabled={loading} className="btn btn-submit">
          {loading ? 'Saving...' : 'Save Schedule'}
        </button>
      </form>

      {/* Modal for adding new category */}
      <AddCategoryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setMessage('');
          setNewCategoryName('');
          setLoading(false);
        }}
        onAddCategory={handleAddCategory}
        loading={loading}
        message={message}
        setNewCategoryName={setNewCategoryName}
        newCategoryName={newCategoryName}
      />

      {/* Display all schedules */}
      <section className="all-schedules">
        <h3>All Scheduled Ikimina</h3>
        {loadingSchedules ? (
          <p>Loading schedules...</p>
        ) : allSchedules.length === 0 ? (
          <p>No schedules found.</p>
        ) : (
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Ikimina Name</th>
                <th>Category</th>
                <th>Days/Dates</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {allSchedules.map((sch) => (
                <tr key={sch.id}>
                  <td>{sch.ikimina_name}</td>
                  <td>{sch.category}</td>
                  <td>{sch.days_or_dates}</td>
                  <td>{sch.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
