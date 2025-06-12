import React, { useState } from 'react';
import axios from 'axios';

const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

const MonthlyScheduleForm = ({ f_id, ikimina_name }) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDate = (date) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDates.length || !time) {
      setMessage('⛔ Please select one or more dates and a time.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/monthly', {
        monthlytime_dates: selectedDates,
        monthlytime_time: time,
        ikimina_name,
        f_id,
      });
      setMessage(`✅ ${res.data.message}`);
      setSelectedDates([]);
      setTime('');
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Error saving monthly times'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <span className="font-medium">Select Dates (1–31):</span>
        <div className="grid grid-cols-6 gap-2 mt-2">
          {daysOfMonth.map((date) => (
            <label key={date} className="flex items-center gap-1">
              <input
                type="checkbox"
                value={date}
                checked={selectedDates.includes(date)}
                onChange={() => toggleDate(date)}
              />
              {date}
            </label>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="font-medium">Time</span>
        <input
          type="time"
          className="w-full border p-2 rounded mt-1"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>

      {message && <p className="text-sm text-gray-700">{message}</p>}

      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Monthly Times'}
      </button>
    </form>
  );
};

export default MonthlyScheduleForm;
