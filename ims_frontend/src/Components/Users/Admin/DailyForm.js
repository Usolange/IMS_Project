import React, { useState } from 'react';
import axios from 'axios';

const DailyScheduleForm = ({ f_id, ikimina_name }) => {
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!time) return setMessage('⛔ Please select a time.');

    try {
      setLoading(true);
      const res = await axios.post('/api/daily', {
        dtime_time: time,
        ikimina_name,
        f_id,
      });
      setMessage(`✅ ${res.data.message}`);
      setTime('');
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Failed to save daily time.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Daily Time'}
      </button>
    </form>
  );
};

export default DailyScheduleForm;
