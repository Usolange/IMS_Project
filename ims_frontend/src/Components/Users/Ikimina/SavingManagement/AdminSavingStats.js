import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminSavingStats = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const ikiUser = JSON.parse(localStorage.getItem('user'));
  const iki_id = ikiUser?.id;

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/savingManagementRoutes/summary/${iki_id}`)
      .then((res) => setData(res.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [iki_id]);

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Member Saving Statistics</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Number</th>
              <th className="p-2">Member Name</th>
              <th className="p-2">Total Saved</th>
              <th className="p-2">Saving Times</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.member_id} className="border-b">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{row.member_names}</td>
                <td className="p-2">{parseFloat(row.total_saved || 0).toLocaleString()}</td>
                <td className="p-2">{row.total_saves}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminSavingStats;
