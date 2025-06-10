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
  const [selectedFrequencyObj, setSelectedFrequencyObj] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [ikiminaName, setIkiminaName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [dailySchedules, setDailySchedules] = useState([]);
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [monthlySchedules, setMonthlySchedules] = useState([]);

  useEffect(() => {
    // Fetch frequencies on mount
    fetchFrequencies();
    // Fetch schedules on mount
    fetchSchedules();
  }, []);

  const fetchFrequencies = async () => {
    try {
      const response = await axios.get('/api/frequencies'); // Change to your API endpoint
      setFrequencies(response.data);
    } catch (error) {
      console.error('Error fetching frequencies:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        axios.get('/api/schedules/daily'),
        axios.get('/api/schedules/weekly'),
        axios.get('/api/schedules/monthly'),
      ]);
      setDailySchedules(dailyRes.data);
      setWeeklySchedules(weeklyRes.data);
      setMonthlySchedules(monthlyRes.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ikiminaName.trim()) {
      setMessage('❌ Please enter the Ikimina Name.');
      return;
    }
    if (!selectedFrequencyObj) {
      setMessage('❌ Please select a frequency category.');
      return;
    }
    if (!selectedTime) {
      setMessage('❌ Please select a time.');
      return;
    }
    if (
      selectedFrequencyObj.f_category.toLowerCase() === 'weekly' &&
      selectedDays.length === 0
    ) {
      setMessage('❌ Please select at least one day of the week.');
      return;
    }
    if (
      selectedFrequencyObj.f_category.toLowerCase() === 'monthly' &&
      selectedDays.length === 0
    ) {
      setMessage('❌ Please select at least one date.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Prepare data for API
      const payload = {
        ikimina_name: ikiminaName,
        frequency_id: selectedFrequencyObj.f_id,
        days: selectedFrequencyObj.f_category.toLowerCase() === 'daily' ? [] : selectedDays,
        time: selectedTime.toTimeString().slice(0, 5), // format HH:mm
      };

      // Send to backend API
      await axios.post('/api/time-schedule', payload);

      setMessage('✅ Time schedule saved successfully!');
      setIkiminaName('');
      setSelectedFrequencyObj(null);
      setSelectedDays([]);
      setSelectedTime(null);

      // Refresh schedules list
      fetchSchedules();
    } catch (error) {
      setMessage('❌ Failed to save time schedule. Try again.');
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
      await axios.post('/api/frequencies', { f_category: newCategoryName.trim() });
      setMessage('✅ Category added successfully!');
      setNewCategoryName('');
      setModalOpen(false);
      fetchFrequencies();
    } catch (error) {
      setMessage('❌ Failed to add category. Try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="time-schedule-container">
        <h2 className="time-schedule-title">Set Ikimina Time</h2>

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
                  <label className="form-label">Frequency Category:</label>
                </td>
                <td>
                  <Select
                    options={frequencies.map((f) => ({
                      value: f.f_id,
                      label: f.f_category,
                      original: f,
                    }))}
                    value={
                      selectedFrequencyObj
                        ? {
                            value: selectedFrequencyObj.f_id,
                            label: selectedFrequencyObj.f_category,
                            original: selectedFrequencyObj,
                          }
                        : null
                    }
                    onChange={(opt) => setSelectedFrequencyObj(opt.original)}
                    placeholder="Select frequency category"
                    isDisabled={loading}
                    noOptionsMessage={() => (
                      <div>
                        No categories found.{' '}
                        <button
                          type="button"
                          onClick={() => setModalOpen(true)}
                          className="btn-link"
                          disabled={loading}
                        >
                          Add Category
                        </button>
                      </div>
                    )}
                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="btn btn-small"
                    disabled={loading}
                    style={{ marginTop: '8px' }}
                  >
                    + Add New Category
                  </button>
                </td>
              </tr>

              {selectedFrequencyObj &&
                selectedFrequencyObj.f_category.toLowerCase() === 'weekly' && (
                  <tr>
                    <td>
                      <label className="form-label">Select Days of Week:</label>
                    </td>
                    <td>
                      <select
                        multiple
                        value={selectedDays}
                        onChange={(e) => {
                          const selectedOptions = Array.from(e.target.selectedOptions).map(
                            (o) => o.value
                          );
                          setSelectedDays(selectedOptions);
                        }}
                        disabled={loading}
                        className="form-multiselect"
                      >
                        {[
                          'Sunday',
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                        ].map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )}

              {selectedFrequencyObj &&
                selectedFrequencyObj.f_category.toLowerCase() === 'monthly' && (
                  <tr>
                    <td>
                      <label className="form-label">Select Dates (1-31):</label>
                    </td>
                    <td>
                      <select
                        multiple
                        value={selectedDays}
                        onChange={(e) => {
                          const selectedOptions = Array.from(e.target.selectedOptions).map(
                            (o) => o.value
                          );
                          const nums = selectedOptions
                            .map((v) => parseInt(v, 10))
                            .filter((v) => v >= 1 && v <= 31);
                          setSelectedDays(nums);
                        }}
                        disabled={loading}
                        className="form-multiselect"
                      >
                        {[...Array(31).keys()].map((i) => {
                          const dayNum = i + 1;
                          return (
                            <option key={dayNum} value={dayNum}>
                              {dayNum}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                )}

              <tr>
                <td>
                  <label className="form-label">Select Time:</label>
                </td>
                <td>
                  <DatePicker
                    selected={selectedTime}
                    onChange={(date) => setSelectedTime(date)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="HH:mm"
                    disabled={loading}
                    className="form-input"
                    placeholderText="Select time"
                  />
                </td>
              </tr>

              <tr>
                <td colSpan={2} style={{ textAlign: 'center', paddingTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Time'}
                  </button>
                </td>
              </tr>

              {message && (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center' }}>
                    <p
                      className={
                        message.startsWith('✅') ? 'message-success' : 'message-error'
                      }
                    >
                      {message}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </form>

        <div className="schedules-display">
          <h3>Daily Schedules</h3>
          {dailySchedules.length ? (
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Ikimina Name</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {dailySchedules.map((item) => (
                  <tr key={item.dtime_id}>
                    <td>{item.ikimina_name}</td>
                    <td>{item.dtime_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No daily schedules found.</p>
          )}

          <h3>Weekly Schedules</h3>
          {weeklySchedules.length ? (
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Ikimina Name</th>
                  <th>Days</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {weeklySchedules.map((item) => (
                  <tr key={item.wtime_id}>
                    <td>{item.ikimina_name}</td>
                    <td>{item.wtime_days}</td>
                    <td>{item.wtime_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No weekly schedules found.</p>
          )}

          <h3>Monthly Schedules</h3>
          {monthlySchedules.length ? (
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Ikimina Name</th>
                  <th>Dates</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {monthlySchedules.map((item) => (
                  <tr key={item.mtime_id}>
                    <td>{item.ikimina_name}</td>
                    <td>{item.mtime_days}</td>
                    <td>{item.mtime_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No monthly schedules found.</p>
          )}
        </div>
      </div>

      <AddCategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddCategory={handleAddCategory}
        loading={loading}
        message={message}
        setNewCategoryName={setNewCategoryName}
        newCategoryName={newCategoryName}
      />
    </>
  );
}
