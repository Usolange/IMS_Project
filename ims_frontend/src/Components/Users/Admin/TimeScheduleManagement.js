import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import '../../CSS/TimeScheduleManagement.css'
import Modal from '../../Home/Modal';

export default function TimeScheduleManagement() {
  const [frequencies, setFrequencies] = useState([]);
  const [selectedFrequencyObj, setSelectedFrequencyObj] = useState(null);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState([]);
  const [sadId, setSadId] = useState(null);
  const [ikiminaName, setIkiminaName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      setSadId(user.id);
    }
  }, []);

  useEffect(() => {
    if (sadId) fetchFrequencies();
  }, [sadId]);

  useEffect(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [modalOpen]);

  const fetchFrequencies = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/frequencyCategory', {
        headers: { 'x-sad-id': sadId }
      });
      setFrequencies(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Add new category in modal
  const addNewCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setCategoryMessage('Category name cannot be empty.');
      return;
    }
    setAddingCategory(true);
    setCategoryMessage('');
    try {
      await axios.post('http://localhost:5000/api/frequencyCategory/newCategory',
        { categoryName: trimmedName },
        { headers: { 'x-sad-id': sadId } }
      );
      setCategoryMessage('✅ Category added successfully!');
      setNewCategoryName('');
      await fetchFrequencies();

      // Select newly added category
      const newCat = frequencies.find(f => f.f_category.toLowerCase() === trimmedName.toLowerCase());
      if (newCat) setSelectedFrequencyObj(newCat);
      setModalOpen(false);
    } catch (error) {
      setCategoryMessage('❌ Failed to add category. It might already exist.');
      console.error(error);
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sadId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    if (!ikiminaName.trim()) {
      alert('Please enter Ikimina name.');
      return;
    }

    if (!selectedFrequencyObj) {
      alert('Please select a frequency category.');
      return;
    }

    setLoading(true);
    const f_id = selectedFrequencyObj?.f_id;

    try {
      if (selectedFrequencyObj?.f_category.toLowerCase() === 'daily') {
        console.log({
          ikimina_name: ikiminaName,
          dtime_time: selectedTime.toTimeString().slice(0, 5),
          f_id,
        });
        await axios.post('http://localhost:5000/api/ikDailyTime', {
          ikimina_name: ikiminaName,
          dtime_time: selectedTime.toTimeString().slice(0, 5),
          f_id,
        });
      } else if (selectedFrequencyObj?.f_category.toLowerCase() === 'weekly') {
        if (selectedDays.length === 0) {
          alert('Please select at least one day.');
          setLoading(false);
          return;
        }
        console.log({
          ikimina_name: ikiminaName,
          weeklytime_days: selectedDays,
          weeklytime_time: selectedTime.toTimeString().slice(0, 5),
          f_id,
        });
        await axios.post('http://localhost:5000/api/ikWeeklyTime', {
          ikimina_name: ikiminaName,
          weeklytime_days: selectedDays,
          weeklytime_time: selectedTime.toTimeString().slice(0, 5),
          f_id,
        });
      } else if (selectedFrequencyObj?.f_category.toLowerCase() === 'monthly') {
        if (selectedDays.length === 0) {
          alert('Please select at least one day.');
          setLoading(false);
          return;
        }
        const invalidDay = selectedDays.find(day => day < 1 || day > 31);
        if (invalidDay !== undefined) {
          alert('Days must be between 1 and 31.');
          setLoading(false);
          return;
        }
        console.log({
          ikimina_name: ikiminaName,
          monthlytime_days: selectedDays,
          monthlytime_time: selectedTime.toTimeString().slice(0, 5),
          f_id,
        });
        await axios.post('http://localhost:5000/api/ikMonthlyTime', {
          ikimina_name: ikiminaName,
          monthlytime_dates: selectedDays, // ✅ must match backend name!
          monthlytime_time: selectedTime.toTimeString().slice(0, 5),
          f_id,
        });

      }

      alert('✅ Time configuration saved successfully!');
      setSelectedFrequencyObj(null);
      setSelectedDays([]);
      setSelectedTime(new Date());
      setIkiminaName('');
      setCategoryMessage('');
    } catch (error) {
      console.error('Error saving time:', error);
      const msg = error.response?.data?.message || 'Failed to save time configuration.';
      alert('❌ ' + msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="time-schedule-container">
        <h2 className="time-schedule-title">Set Ikimina Time</h2>

        <form onSubmit={handleSubmit} className="time-schedule-form">
          <div className="form-group">
            <label htmlFor="ikiminaName" className="form-label">Ikimina Name:</label>
            <input
              id="ikiminaName"
              type="text"
              value={ikiminaName}
              onChange={(e) => setIkiminaName(e.target.value)}
              required
              className="form-input"
              placeholder="Enter Ikimina Name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="frequencySelect" className="form-label">Frequency Category:</label>
            <div className="frequency-select-wrapper">
              <select
                id="frequencySelect"
                className="form-select"
                value={selectedFrequencyObj?.f_id || ''}
                onChange={(e) => {
                  const selected = frequencies.find(f => f.f_id === parseInt(e.target.value));
                  setSelectedFrequencyObj(selected);
                }}
                required
              >
                <option value="">-- Select Frequency --</option>
                {frequencies.map((f) => (
                  <option key={f.f_id} value={f.f_id}>
                    {f.f_category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setNewCategoryName('');
                  setCategoryMessage('');
                  setModalOpen(true);
                }}
                className="btn btn-add-category"
                title="Add New Frequency Category"
              >
                + Add
              </button>
            </div>
          </div>

          {selectedFrequencyObj?.f_category.toLowerCase() === 'daily' && (
            <div className="form-group">
              <label className="form-label">Daily Time:</label>
              <DatePicker
                selected={selectedTime}
                onChange={setSelectedTime}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="HH:mm"
                className="form-input"
              />
            </div>
          )}

          {selectedFrequencyObj?.f_category.toLowerCase() === 'weekly' && (
            <>
              <div className="form-group">
                <label className="form-label">Days of the Week (multi-select):</label>
                <Select
                  isMulti
                  value={selectedDays.map(day => ({ value: day, label: day }))}
                  onChange={options => setSelectedDays(options.map(opt => opt.value))}
                  options={[
                    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
                  ].map(day => ({ value: day, label: day }))}
                  className="multi-select"
                  classNamePrefix="select"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time:</label>
                <DatePicker
                  selected={selectedTime}
                  onChange={setSelectedTime}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="HH:mm"
                  className="form-input"
                />
              </div>
            </>
          )}

          {selectedFrequencyObj?.f_category.toLowerCase() === 'monthly' && (
            <>
              <div className="form-group">
                <label className="form-label">Select Days of the Month:</label>
                <div className="days-checkboxes" style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px' }}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <label key={day} style={{ marginRight: 12, cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        value={day}
                        checked={selectedDays.includes(day)}
                        onChange={(e) => {
                          const dayNum = parseInt(e.target.value);
                          if (e.target.checked) {
                            setSelectedDays(prev => [...prev, dayNum].sort((a, b) => a - b));
                          } else {
                            setSelectedDays(prev => prev.filter(d => d !== dayNum));
                          }
                        }}
                        style={{ marginRight: 4 }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Time for all selected days:</label>
                <DatePicker
                  selected={selectedTime}
                  onChange={setSelectedTime}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="HH:mm"
                  className="form-input"
                />
              </div>
            </>
          )}


          <button
            type="submit"
            disabled={loading}
            className="btn btn-submit"
          >
            {loading ? 'Saving...' : 'Save Time Setting'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/adminDashboard')}
            className="btn btn-back"
          >
            ← Back to Dashboard
          </button>
        </form>
      </div>

      {/* Modal for adding new category */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add New Frequency Category</h3>
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              ref={inputRef}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="modal-input"
            />
            {categoryMessage && (
              <p className={`modal-message ${categoryMessage.startsWith('✅') ? 'success' : 'error'}`}>
                {categoryMessage}
              </p>
            )}
            <div className="modal-actions">
              <button
                onClick={() => setModalOpen(false)}
                className="btn btn-cancel"
                disabled={addingCategory}
              >
                Cancel
              </button>
              <button
                onClick={addNewCategory}
                className="btn btn-confirm"
                disabled={addingCategory}
              >
                {addingCategory ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
