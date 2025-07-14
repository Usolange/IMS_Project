import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SavingActivityLog = ({ iki_id }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/saving-activities/${iki_id}`)
      .then(res => setActivities(res.data))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [iki_id]);

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">All Member Saving Activities</h2>
      {loading ? (
        <p>Loading...</p>
      ) : activities.length === 0 ? (
        <p>No saving activities found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">#</th>
                <th className="p-2">Member</th>
                <th className="p-2">Date</th>
                <th className="p-2">Time</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Penalty</th>
                <th className="p-2">Late?</th>
                <th className="p-2">Saved At</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a, i) => (
                <tr key={a.save_id} className="border-b">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{a.member_names}</td>
                  <td className="p-2">{a.slot_date}</td>
                  <td className="p-2">{a.slot_time}</td>
                  <td className="p-2">{parseFloat(a.saved_amount).toLocaleString()}</td>
                  <td className="p-2 text-red-600">{parseFloat(a.penalty_applied).toFixed(2)}</td>
                  <td className="p-2">{a.is_late ? 'Yes' : 'No'}</td>
                  <td className="p-2">{a.saved_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SavingActivityLog;
