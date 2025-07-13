import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PenaltyManagementDashboard = () => {
  const iki_id = localStorage.getItem('iki_id');

  const [penaltyTimeDelay, setPenaltyTimeDelay] = useState(0);
  const [penaltyDateDelay, setPenaltyDateDelay] = useState(0);
  const [savingGapTime, setSavingGapTime] = useState('01:00');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [schedule, setSchedule] = useState([]);
  const [frequency, setFrequency] = useState('');
  const [ikiminaName, setIkiminaName] = useState('');
  const [loading, setLoading] = useState(true);

  const minutesToHHmm = (minutes) => {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  const HHmmToMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [penaltyRes, scheduleRes] = await Promise.all([
          axios.get('/api/penalityManagementRoutes/myInfo', {
            headers: { 'x-iki-id': iki_id },
          }),
          axios.get(`/api/ikimina/schedule/${iki_id}`)
        ]);

        const penalty = penaltyRes.data.data;
        setPenaltyTimeDelay(penalty.penalty_time_delay);
        setPenaltyDateDelay(penalty.penalty_date_delay);
        setSavingGapTime(minutesToHHmm(penalty.saving_period_gap));

        const sched = scheduleRes.data;
        setSchedule(sched.schedule);
        setFrequency(sched.frequency);
        setIkiminaName(sched.ikimina);
      } catch (err) {
        console.error('Dashboard load failed:', err);
        setError('Failed to load penalty or schedule info.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [iki_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!savingGapTime || !savingGapTime.includes(':')) {
      setError('Please enter a valid time format for Saving Gap.');
      return;
    }

    try {
      await axios.put('/api/penalityManagementRoutes/myPenalties', {
        penalty_time_delay: parseInt(penaltyTimeDelay),
        penalty_date_delay: parseInt(penaltyDateDelay),
        saving_period_gap: HHmmToMinutes(savingGapTime)
      }, {
        headers: { 'x-iki-id': iki_id }
      });

      setMessage('Penalty settings updated successfully.');
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update penalty settings.');
    }
  };

  if (loading) return <div className="text-gray-500 p-4">Loading penalty management dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-lg space-y-8">
      <h1 className="text-2xl font-bold text-blue-700">Penalty Management for {ikiminaName}</h1>

      {/* Penalty Settings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Penalty Settings</h2>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm">Time Delay Penalty (RWF)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={penaltyTimeDelay}
              onChange={(e) => setPenaltyTimeDelay(e.target.value)}
              min={0}
              required
            />
          </div>
          <div>
            <label className="block text-sm">Date Delay Penalty (RWF)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={penaltyDateDelay}
              onChange={(e) => setPenaltyDateDelay(e.target.value)}
              min={0}
              required
            />
          </div>
          <div>
            <label className="block text-sm">Saving Gap (HH:mm)</label>
            <input
              type="time"
              className="w-full p-2 border rounded"
              value={savingGapTime}
              onChange={(e) => setSavingGapTime(e.target.value)}
              required
            />
          </div>

          <div className="col-span-full">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save Penalty Settings
            </button>
            {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>
        </form>
      </section>

      {/* Schedule Display */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Time Schedule ({frequency.toUpperCase()})
        </h2>
        {schedule.length === 0 ? (
          <p className="text-gray-500">No schedule set for this Ikimina.</p>
        ) : (
          <ul className="space-y-2">
            {schedule.map((entry) => (
              <li key={entry.id} className="p-3 border rounded bg-gray-50">
                {frequency === 'daily' && <>Time: {entry.time}</>}
                {frequency === 'weekly' && <>Day: <strong>{entry.day}</strong> - Time: {entry.time}</>}
                {frequency === 'monthly' && <>Date: <strong>{entry.date}</strong> - Time: {entry.time}</>}
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-gray-500 mt-2">
          <strong>Note:</strong> A member must save on scheduled time + saving gap. Otherwise, penalties apply automatically.
        </p>
      </section>
    </div>
  );
};

export default PenaltyManagementDashboard;
