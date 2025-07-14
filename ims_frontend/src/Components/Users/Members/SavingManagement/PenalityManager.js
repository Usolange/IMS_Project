import React, { useState } from 'react';
import axios from 'axios';

export default function ApplyPenaltyButton() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const applyPenalties = async () => {
    const ikiId = localStorage.getItem('iki_id');
    if (!ikiId) {
      setMessage('Error: Ikimina ID not found in localStorage');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post(
        '/api/penalties/apply-auto',
        {},
        {
          headers: { 'x-iki-id': ikiId },
        }
      );
      setMessage(res.data.message || 'Penalties applied successfully');
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Error applying penalties'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={applyPenalties}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? 'Applying...' : 'Apply Penalties'}
      </button>
      {message && <p className="mt-2 text-gray-700">{message}</p>}
    </div>
  );
}
