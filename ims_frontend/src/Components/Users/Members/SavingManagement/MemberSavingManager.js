import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const STATUS_STYLES = {
  saved: { backgroundColor: '#d1e7dd', color: '#0f5132' },
  missed: { backgroundColor: '#f8d7da', color: '#842029' },
  current: { backgroundColor: '#fff3cd', color: '#664d03' },
  upcoming: { backgroundColor: '#cfe2ff', color: '#084298' },
};

const MemberSavingManager = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [slotDetails, setSlotDetails] = useState(null);
  const [amount, setAmount] = useState('');
  const [phoneUsed, setPhoneUsed] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Get logged-in user info from localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const memberId = user?.id || null;
  const ikiId = user?.iki_id || null;

  // Fetch member saving slots on load or member/ikiId change
  useEffect(() => {
    if (!memberId || !ikiId) {
      setLoading(false);
      return;
    }

    const fetchSlots = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/savingManagementRoutes/memberSlots/${memberId}/${ikiId}`
        );
        if (Array.isArray(res.data)) {
          setSlots(res.data);
        } else {
          alert('Failed to load saving slots.');
        }
      } catch (error) {
        alert('Error fetching slots.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [memberId, ikiId]);

  // Fetch details for the selected slot
  useEffect(() => {
    if (!selectedSlotId || !memberId) {
      setSlotDetails(null);
      setAmount('');
      setPhoneUsed('');
      setFormMessage('');
      return;
    }

    setSlotDetails(null);
    axios
      .get(
        `http://localhost:5000/api/savingManagementRoutes/slotDetails/${selectedSlotId}/${memberId}`
      )
      .then((res) => {
        setSlotDetails(res.data);
        setAmount('');
        setPhoneUsed('');
        setFormMessage('');
      })
      .catch(() => alert('Failed to load slot details'));
  }, [selectedSlotId, memberId]);

  const closeModal = () => {
    setSelectedSlotId(null);
    setFormMessage('');
    setAmount('');
    setPhoneUsed('');
    setSlotDetails(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormMessage('');
    setSaving(true);

    if (!slotDetails) {
      setFormMessage('No slot selected.');
      setSaving(false);
      return;
    }

    const minAmount = slotDetails.saving_ratio;
    const valAmount = Number(amount);

    if (valAmount < minAmount || valAmount % minAmount !== 0) {
      setFormMessage(`Amount must be at least ${minAmount} and a multiple of it.`);
      setSaving(false);
      return;
    }

    // Validate phone number if entered
    if (phoneUsed && !/^\d{10,15}$/.test(phoneUsed)) {
      setFormMessage('Phone used must be 10 to 15 digits.');
      setSaving(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/savingManagementRoutes/saveSlot', {
        slot_id: selectedSlotId,
        member_id: memberId,
        amount: valAmount,
        phone_used: phoneUsed || null,
      });

      setFormMessage(res.data.message || 'Saved successfully!');

      // Refresh slots after save
      const refreshed = await axios.get(
        `http://localhost:5000/api/savingManagementRoutes/memberSlots/${memberId}/${ikiId}`
      );
      setSlots(Array.isArray(refreshed.data) ? refreshed.data : []);

      // Automatically close modal after success
      setTimeout(() => closeModal(), 1200);
    } catch (err) {
      setFormMessage(err.response?.data?.message || 'Saving failed');
    }

    setSaving(false);
  };

  if (!user) return <p>Please log in to access your saving slots.</p>;
  if (loading) return <p>Loading slots...</p>;

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <h2>My Saving Slots</h2>
      {slots.length === 0 ? (
        <p>No saving slots found.</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          cellSpacing="0"
          style={{ width: '100%', maxWidth: '800px', marginBottom: '1rem', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th>Date</th>
              <th>Scheduled Time</th>
              <th>Actual Saving Status</th>
              <th>Saved Amount</th>
              <th>Phone Used</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => {
              const rowStatus = slot.friendly_status || 'upcoming';
              const style = STATUS_STYLES[rowStatus] || {};

              return (
                <tr key={slot.slot_id} style={style}>
                  <td>{dayjs(slot.slot_date).format('YYYY-MM-DD')}</td>
                  <td>{slot.slot_time ? slot.slot_time.slice(0, 5) : '—'}</td>
                  <td>{slot.is_saved ? 'Saved' : '—'}</td>
                  <td>{slot.saved_amount ?? '—'}</td>
                  <td>{slot.phone_used ?? '—'}</td>
                  <td style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{rowStatus}</td>
                  <td>
                    {(rowStatus === 'current' || rowStatus === 'upcoming') && !slot.is_saved ? (
                      <button onClick={() => setSelectedSlotId(slot.slot_id)} aria-label={`Save for slot on ${dayjs(slot.slot_date).format('YYYY-MM-DD')}`}>
                        Save
                      </button>
                    ) : rowStatus === 'saved' ? (
                      '✔ Saved'
                    ) : rowStatus === 'missed' ? (
                      '❌ Missed'
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal for saving */}
      {selectedSlotId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalTitle"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            }}
          >
            {slotDetails ? (
              <>
                <h3 id="modalTitle">Save for Slot</h3>
                <p>
                  <b>Date:</b> {dayjs(slotDetails.slot_date).format('YYYY-MM-DD')}
                </p>
                <p>
                  <b>Scheduled Time:</b> {slotDetails.slot_time ? slotDetails.slot_time.slice(0, 5) : '—'}
                </p>
                <p>
                  <b>Saving Ratio:</b> {slotDetails.saving_ratio}
                </p>

                <form onSubmit={handleSave} noValidate>
                  <div style={{ marginBottom: '8px' }}>
                    <label htmlFor="amountInput">
                      Amount (Min: {slotDetails.saving_ratio}):<br />
                      <input
                        id="amountInput"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={slotDetails.saving_ratio}
                        required
                        disabled={saving}
                        aria-describedby="amountHelp"
                      />
                    </label>
                    <small id="amountHelp" style={{ color: 'gray' }}>
                      Must be a multiple of {slotDetails.saving_ratio}
                    </small>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label htmlFor="phoneInput">
                      Phone Used (optional):<br />
                      <input
                        id="phoneInput"
                        type="tel"
                        value={phoneUsed}
                        onChange={(e) => setPhoneUsed(e.target.value)}
                        placeholder="Leave blank to use default"
                        disabled={saving}
                        pattern="\d{10,15}"
                        title="Enter 10 to 15 digits"
                        aria-describedby="phoneHelp"
                      />
                    </label>
                    <small id="phoneHelp" style={{ color: 'gray' }}>
                      Optional. Enter 10 to 15 digits.
                    </small>
                  </div>
                  <button type="submit" disabled={saving} style={{ cursor: saving ? 'wait' : 'pointer' }}>
                    {saving ? 'Saving...' : 'Submit Saving'}
                  </button>
                </form>

                {formMessage && (
                  <p
                    style={{
                      marginTop: '10px',
                      color: formMessage.toLowerCase().includes('fail') ? 'red' : 'green',
                    }}
                    role="alert"
                  >
                    {formMessage}
                  </p>
                )}

                <button onClick={closeModal} style={{ marginTop: '10px' }}>
                  Close
                </button>
              </>
            ) : (
              <p>Loading slot details...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSavingManager;
