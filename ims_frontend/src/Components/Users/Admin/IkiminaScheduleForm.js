import React, { useState, useEffect } from 'react';
import DailyForm from './DailyForm';
import WeeklyForm from './WeeklyForm';
import MonthlyForm from './MonthlyForm';
import '../../CSS/IkiminaSchedule.css';

export default function IkiminaScheduleForm({ categories }) {
  const [frequency, setFrequency] = useState(''); // 'daily' | 'weekly' | 'monthly'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sadId, setSadId] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        if (user?.id) setSadId(user.id);
      } catch {
        // ignore invalid JSON
      }
    }
  }, []);

  const handleFrequencyChange = (e) => {
    const selectedFreq = e.target.value;
    setFrequency(selectedFreq);
    setSubmitMessage('');

    // Find the category that matches selected frequency
    const match = (categories || []).find(
      (c) => c.f_category?.toLowerCase() === selectedFreq
    );
    setSelectedCategory(match?.f_id || '');
  };

  const handleSubmit = async (formData) => {
    if (!selectedCategory || !frequency) {
      setSubmitMessage('Please select a frequency before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitMessage('');

    const payload = { ...formData, f_id: selectedCategory };

    try {
      let url = '';
      if (frequency === 'daily') url = 'http://localhost:5000/api/schedule/daily';
      else if (frequency === 'weekly') url = 'http://localhost:5000/api/schedule/weekly';
      else if (frequency === 'monthly') url = 'http://localhost:5000/api/schedule/monthly';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sad-id': sadId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitMessage(data.message || 'Schedule saved successfully.');
      } else {
        setSubmitMessage(data.message || 'Error saving schedule.');
      }
    } catch {
      setSubmitMessage('Network error: Could not save schedule.');
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Set Ikimina Schedule</h2>

      <label htmlFor="frequency" className="block mb-1 font-medium">
        Select Frequency
      </label>
      <select
        id="frequency"
        className="w-full mb-6 p-2 border rounded"
        value={frequency}
        onChange={handleFrequencyChange}
        disabled={submitting}
      >
        <option value="">-- Select frequency --</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      {frequency === 'daily' && (
        <DailyForm onSubmit={handleSubmit} disabled={submitting} />
      )}
      {frequency === 'weekly' && (
        <WeeklyForm onSubmit={handleSubmit} disabled={submitting} />
      )}
      {frequency === 'monthly' && (
        <MonthlyForm onSubmit={handleSubmit} disabled={submitting} />
      )}

      {submitMessage && (
        <div className="mt-4 p-3 rounded bg-blue-100 text-blue-700">
          {submitMessage}
        </div>
      )}

      {submitting && (
        <div className="mt-2 text-gray-600 font-medium">Submitting...</div>
      )}
    </div>
  );
}
