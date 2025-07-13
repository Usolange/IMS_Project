import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SaveMoneyForm = ({ onSaveSuccess }) => {
  const [amount, setAmount] = useState('');
  const [ikiminaOptions, setIkiminaOptions] = useState([]);
  const [iki_id, setIkiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState(''); // success | error

  const member = JSON.parse(localStorage.getItem('member')); // expected to be stored after login

  useEffect(() => {
    const fetchIkiminaGroups = async () => {
      try {
        const res = await axios.get(`/api/member/ikimina/${member.member_id}`);
        setIkiminaOptions(res.data);
        if (res.data.length === 1) {
          setIkiId(res.data[0].iki_id); // auto-select if only one group
        }
      } catch (err) {
        setMsgType('error');
        setMsg('Failed to load Ikimina groups.');
      }
    };

    fetchIkiminaGroups();
  }, [member.member_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setMsgType('error');
      setMsg("Please enter a valid positive amount.");
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/saveMoney', { amount, iki_id });
      setMsgType('success');
      setMsg('Saving recorded successfully!');
      setAmount('');
      if (onSaveSuccess) onSaveSuccess(); // Notify parent if needed
    } catch (error) {
      setMsgType('error');
      setMsg('Failed to record saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4 text-center">💸 Make a New Saving</h2>

      <p className="text-sm mb-2 text-gray-600">Logged in as: <strong>{member?.member_names}</strong></p>

      {msg && (
        <div
          className={`mb-4 p-3 rounded text-sm ${msgType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {msg}
        </div>
      )}

      <label className="block mb-1 font-medium">Ikimina Group</label>
      <select
        value={iki_id}
        onChange={(e) => setIkiId(e.target.value)}
        className="mb-4 p-2 border rounded w-full"
        required
      >
        <option value="">-- Select Group --</option>
        {ikiminaOptions.map((ik) => (
          <option key={ik.iki_id} value={ik.iki_id}>
            {ik.iki_name}
          </option>
        ))}
      </select>

      <label className="block mb-1 font-medium">Amount to Save (RWF)</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mb-4 p-2 border rounded w-full"
        min="1"
        placeholder="Enter amount"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className={`w-full px-4 py-2 rounded text-white ${loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading ? 'Saving...' : 'Save Money'}
      </button>
    </form>
  );
};

export default SaveMoneyForm;
