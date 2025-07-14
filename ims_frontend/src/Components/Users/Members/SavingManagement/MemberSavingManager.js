import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MemberSavingManager = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState(null);
  const [savingLoading, setSavingLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('MTN');

  const user = JSON.parse(localStorage.getItem('user'));
  const memberId = user?.id;
  const ikiId = user?.iki_id;

  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch saving slots
  useEffect(() => {
    if (!memberId || !ikiId) {
      setMessage({ type: 'error', text: 'User not authenticated.' });
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(`http://localhost:5000/api/SavingInfoRoutes/savingSlots/member/${memberId}/${ikiId}`)
      .then((res) => {
        setSlots(res.data.slots || []);
      })
      .catch((err) => {
        console.error('Error fetching saving slots:', err);
        setMessage({ type: 'error', text: 'Failed to load saving slots.' });
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [memberId, ikiId]);

  // Handle save
  const handleSaveMoney = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid positive amount.' });
      return;
    }

    if (!selectedSlot) return;

    setSavingLoading(true);
    setMessage(null);

    try {
      const res = await axios.post('http://localhost:5000/api/SavingInfoRoutes/saveMoney', {
        member_id: memberId,
        iki_id: ikiId,
        amount: Number(amount),
        ikiminaSavingDate: selectedSlot.target_date,
        payment_method: paymentMethod,
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });

        setSlots((prev) =>
          prev.map((s) =>
            s.slot_id === selectedSlot.slot_id
              ? { ...s, status: 'saved', saved_amount: amount }
              : s
          )
        );
        setSelectedSlot(null);
        setAmount('');
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Failed to save money.' });
      }
    } catch (err) {
      console.error('Error saving money:', err);
      const errMsg = err.response?.data?.message || 'Error saving money.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSavingLoading(false);
    }
  };

  // Classify slot status for color
  const getSlotStyle = (slot) => {
    if (slot.status === 'saved') return 'bg-green-200';
    if (slot.status === 'missed') return 'bg-red-200';
    if (slot.target_date === todayStr && slot.status !== 'saved') return 'bg-yellow-200';
    if (slot.target_date > todayStr && slot.status !== 'saved') return 'bg-blue-200';
    return 'bg-gray-200';
  };

  if (!memberId || !ikiId) {
    return <div className="text-red-600 p-4">User not authenticated.</div>;
  }

  if (loading) return <div>Loading saving slots...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Your Saving Slots</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {slots.length === 0 && <p>No saving slots found.</p>}

        {slots.map((slot) => {
          const cardStyle = getSlotStyle(slot);

          return (
            <div
              key={slot.slot_id}
              className={`${cardStyle} rounded p-4 cursor-pointer hover:shadow-lg`}
              onClick={() => {
                if (slot.status !== 'saved') setSelectedSlot(slot);
              }}
              title={
                slot.status === 'saved'
                  ? `Saved: ${slot.saved_amount}`
                  : `Due date: ${slot.target_date}`
              }
            >
              <p className="font-semibold">{slot.target_date}</p>
              <p>Status: {slot.status || 'pending'}</p>
              {slot.status === 'saved' && <p>Amount: {slot.saved_amount} RWF</p>}
            </div>
          );
        })}
      </div>

      {selectedSlot && (
        <div className="mt-6 p-4 border rounded bg-white max-w-md">
          <h3 className="mb-2 font-semibold">
            Save Money for {selectedSlot.target_date}
          </h3>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 w-full mb-2"
          />

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border p-2 w-full mb-3"
          >
            <option value="MTN">MTN Mobile Money</option>
            <option value="AIRTEL">Airtel Money</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleSaveMoney}
              disabled={savingLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {savingLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setSelectedSlot(null);
                setAmount('');
                setMessage(null);
              }}
              className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSavingManager;
