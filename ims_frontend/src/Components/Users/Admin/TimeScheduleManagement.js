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

  // store combined schedules here:
  const [allSchedules, setAllSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  useEffect(() => {
    fetchFrequencies();
    fetchSchedules();
  }, []);




  const fetchFrequencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/frequencyCategory/selectCategories', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const options = res.data.map((cat) => ({
        value: cat.f_id,
        label: cat.f_category,
        ...cat,  // keep other data if you want
      }));

      setFrequencies(options);
    } catch (error) {
      console.error('Failed to fetch frequencies:', error);
    }
  };




  // Fetch all schedules combined and sorted
  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([

        axios.get(`/api/ikDailyTime/daily`),    // no userId param
        axios.get(`/api/ikWeeklyTime/weekly`),
        axios.get(`/api/ikMonthlyTime/monthly`),



      ]);

      // Map daily schedules
      const dailySchedules = dailyRes.data.map((item) => ({
        id: item.dtime_id,
        ikimina_name: item.ikimina_name,
        category: 'Daily',
        days_or_dates: '-', // no days for daily
        time: item.dtime_time,
      }));

      // Map weekly schedules
      const weeklySchedules = weeklyRes.data.map((item) => ({
        id: item.wtime_id,
        ikimina_name: item.ikimina_name,
        category: 'Weekly',
        days_or_dates: item.wtime_days,
        time: item.wtime_time,
      }));

      // Map monthly schedules
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
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setAllSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
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

      await axios.post('/api/time-schedule/setSchedule', {
        f_id: selectedFrequency.f_id,
        scheduleData,
      });

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setMessage('❌ Please enter a category name.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/frequencyCategory', { f_category: newCategoryName.trim() });
      setMessage('✅ Category added successfully!');
      setNewCategoryName('');
      setModalOpen(false);
      fetchFrequencies();
    } catch (error) {
      setMessage('❌ Failed to add category. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="time-schedule-container">
        <h2 className="time-schedule-title">Set Ikimina Time</h2>

        <div className="schedules-display">
          <h3>All Schedules</h3>
          {loadingSchedules ? (
            <p>Loading schedules...</p>
          ) : allSchedules.length === 0 ? (
            <p>No schedules found.</p>
          ) : (
            <table className="combined-schedule-table" border="1" cellPadding="8" cellSpacing="0">
              <thead>
                <tr>
                  <th>Ikimina Name</th>
                  <th>Frequency Category</th>
                  <th>Days / Dates</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {allSchedules.map((item) => (
                  <tr key={`${item.category}-${item.id}`}>
                    <td>{item.ikimina_name}</td>
                    <td>{item.category}</td>
                    <td>{item.days_or_dates}</td>
                    <td>{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="time-schedule-form">
  <table className="form-table">
    <tbody>
      <tr>
        <td>
          <label htmlFor="ikiminaName" className="form-label">
            Ikimina Name:
          </label>
        </td>
        <td>
          <input
            id="ikiminaName"
            type="text"
            value={ikiminaName}
            onChange={(e) => setIkiminaName(e.target.value)}
            required
            className="form-input"
            placeholder="Enter Ikimina description"
            disabled={loading}
          />
        </td>
      </tr>
      <tr>
        <td>
          <label htmlFor="frequency" className="form-label">
            Frequency Category:
          </label>
        </td>
        <td>
          <Select
            options={frequencies}
            value={selectedFrequency}
            onChange={setSelectedFrequency}
            placeholder="Select frequency category"
            isDisabled={loading}
          />
          <button
            type="button"
            className="btn btn-add-category"
            onClick={() => setModalOpen(true)}
            disabled={loading}
          >
            + Add Category
          </button>
        </td>
      </tr>
      {(selectedFrequency?.label.toLowerCase() === 'weekly' ||
        selectedFrequency?.label.toLowerCase() === 'monthly') && (
        <tr>
          <td>
            <label className="form-label">
              {selectedFrequency.label.toLowerCase() === 'weekly'
                ? 'Select Days:'
                : 'Select Dates:'}
            </label>
          </td>
          <td>
            <Select
              isMulti
              options={
                selectedFrequency.label.toLowerCase() === 'weekly'
                  ? [
                      { value: 'Monday', label: 'Monday' },
                      { value: 'Tuesday', label: 'Tuesday' },
                      { value: 'Wednesday', label: 'Wednesday' },
                      { value: 'Thursday', label: 'Thursday' },
                      { value: 'Friday', label: 'Friday' },
                      { value: 'Saturday', label: 'Saturday' },
                      { value: 'Sunday', label: 'Sunday' },
                    ]
                  : Array.from({ length: 31 }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: (i + 1).toString(),
                    }))
              }
              getOptionLabel={(e) => e.label}
              getOptionValue={(e) => e.value}
              value={selectedDays.map((day) =>
                typeof day === 'string' ? { value: day, label: day } : day
              )}
              onChange={(selected) =>
                setSelectedDays(selected ? selected.map((s) => s.value) : [])
              }
              isDisabled={loading}
              placeholder={`Select ${selectedFrequency.label.toLowerCase()} days/dates`}
            />
          </td>
        </tr>
      )}
      <tr>
        <td>
          <label htmlFor="time" className="form-label">
            Select Time:
          </label>
        </td>
        <td>
          <DatePicker
            id="time"
            selected={selectedTime}
            onChange={(date) => setSelectedTime(date)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="HH:mm"
            placeholderText="Select time"
            disabled={loading}
            className="form-input"
          />
        </td>
      </tr>
      <tr>
        <td colSpan="2" style={{ textAlign: 'center' }}>
          <button type="submit" className="btn btn-submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Schedule'}
          </button>
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan="2"
            className={`form-message ${
              message.startsWith('✅') ? 'success' : 'error'
            }`}
          >
            {message}
          </td>
        </tr>
      )}
    </tbody>
  </table>
</form>


      <AddCategoryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setMessage('');
          setNewCategoryName('');
        }}
        onAddCategory={handleAddCategory}
        loading={loading}
        message={message}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
      />
    </>
  );
}
