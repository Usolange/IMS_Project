import React, { useState } from 'react';
import DailyScheduleForm from './DailyScheduleForm';
import WeeklyScheduleForm from './WeeklyScheduleForm';
import MonthlyScheduleForm from './MonthlyScheduleForm';

const ScheduleForm = ({ f_id, ikimina_name }) => {
  const [frequency, setFrequency] = useState('');
  
  return (
    <div className="p-4 bg-white shadow-md rounded-xl max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Set Ikimina Schedule</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Select Frequency</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">-- Choose --</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {frequency === 'daily' && <DailyScheduleForm f_id={f_id} ikimina_name={ikimina_name} />}
      {frequency === 'weekly' && <WeeklyScheduleForm f_id={f_id} ikimina_name={ikimina_name} />}
      {frequency === 'monthly' && <MonthlyScheduleForm f_id={f_id} ikimina_name={ikimina_name} />}
    </div>
  );
};

export default ScheduleForm;
