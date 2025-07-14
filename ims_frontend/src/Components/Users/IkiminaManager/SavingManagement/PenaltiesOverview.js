import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PenaltiesOverview = ({ iki_id }) => {
  const [penalties, setPenalties] = useState({ timeDelayCount: 0, dateDelayCount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/penalties-overview/${iki_id}`)
      .then(res => setPenalties(res.data))
      .catch(() => setPenalties({ timeDelayCount: 0, dateDelayCount: 0 }))
      .finally(() => setLoading(false));
  }, [iki_id]);

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Penalty Overview</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="list-disc pl-6">
          <li><strong>Time Delay Penalties:</strong> {penalties.timeDelayCount}</li>
          <li><strong>Date Delay Penalties:</strong> {penalties.dateDelayCount}</li>
        </ul>
      )}
    </div>
  );
};

export default PenaltiesOverview;
