import React, { useState } from 'react';
import axios from 'axios';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyScheduleForm = ({ f_id, ikimina_name }) => {
  const [selectedDays, setSelectedDays] = useState([]);
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDays.length || !time) {
      setMessage('⛔ Please select at least one day and a time.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/weeklyTimeRoutes', {
        weeklytime_days: selectedDays,
        weeklytime_time: time,
        ikimina_name,
        f_id,
      });
      setMessage(`✅ ${res.data.message}`);
      setSelectedDays([]);
      setTime('');
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Error saving weekly times'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <span className="font-medium">Select Days:</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {daysOfWeek.map((day) => (
            <label key={day} className="flex items-center gap-1">
              <input
                type="checkbox"
                value={day}
                checked={selectedDays.includes(day)}
                onChange={() => toggleDay(day)}
              />
              {day}
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
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Weekly Times'}
      </button>
    </form>
  );
};

export default WeeklyScheduleForm;
