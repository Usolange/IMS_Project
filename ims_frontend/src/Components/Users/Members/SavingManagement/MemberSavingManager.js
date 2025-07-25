import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

import '../../../CSS/MemberSavingManager.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const MemberSavingManager = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [slotDetails, setSlotDetails] = useState(null);
  const [amount, setAmount] = useState('');
  const [phoneUsed, setPhoneUsed] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalPurpose, setModalPurpose] = useState(''); // 'save' or 'penalty'

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const memberId = user?.id || null;
  const ikiId = user?.iki_id || null;

  useEffect(() => {
    if (!memberId || !ikiId) {
      setLoading(false);
      return;
    }

    const fetchSlots = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/savingManagementRoutes/memberSlots/${memberId}/${ikiId}`);
        setSlots(Array.isArray(res.data) ? res.data : []);
      } catch {
        alert('Error fetching slots.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [memberId, ikiId]);

  useEffect(() => {
    if (!selectedSlotId || !memberId) return;

    setSlotDetails(null);
    axios
      .get(`http://localhost:5000/api/savingManagementRoutes/slotDetails/${selectedSlotId}/${memberId}`)
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
    setModalPurpose('');
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    setFormMessage('');
    setSaving(true);

    if (!slotDetails) {
      setFormMessage('No slot selected.');
      setSaving(false);
      return;
    }

    try {
      if (modalPurpose === 'save') {
        const valAmount = Number(amount);
        const minAmount = slotDetails.saving_ratio;

        if (valAmount < minAmount || valAmount % minAmount !== 0) {
          setFormMessage(`Amount must be at least ${minAmount} and a multiple of it.`);
          setSaving(false);
          return;
        }

        if (phoneUsed && !/^\d{10,15}$/.test(phoneUsed)) {
          setFormMessage('Phone must be 10 to 15 digits.');
          setSaving(false);
          return;
        }

        const res = await axios.post('http://localhost:5000/api/savingManagementRoutes/newSaving', {
          slot_id: selectedSlotId,
          member_id: memberId,
          amount: valAmount,
          phone: phoneUsed || null,
        });

        setFormMessage(res.data.message || 'Saved successfully!');
      } else if (modalPurpose === 'penalty') {
        if (slotDetails.penalty_paid) {
          setFormMessage('Penalty already paid.');
          setSaving(false);
          return;
        }

        await axios.post('http://localhost:5000/api/savingManagementRoutes/payPenalty', {
          slot_id: selectedSlotId,
          member_id: memberId,
        });

        const updatedSlot = await axios.get(
          `http://localhost:5000/api/savingManagementRoutes/slotDetails/${selectedSlotId}/${memberId}`
        );
        setSlotDetails(updatedSlot.data);

        await axios.post('http://localhost:5000/api/savingManagementRoutes/logNotification', {
          slot_id: selectedSlotId,
          member_id: memberId,
        });

        setFormMessage('Penalty paid!');
      }

      const refreshed = await axios.get(`http://localhost:5000/api/savingManagementRoutes/memberSlots/${memberId}/${ikiId}`);
      setSlots(Array.isArray(refreshed.data) ? refreshed.data : []);
      setTimeout(() => closeModal(), 1200);
    } catch (err) {
      setFormMessage(err.response?.data?.message || 'Action failed');
    }

    setSaving(false);
  };

  // Update slot friendly status based on time
  const updateSlotStatus = (slot) => {
    const now = dayjs().tz('Africa/Kigali');
    let friendlyStatus = 'upcoming';

    const slotDateTime = dayjs.tz(`${slot.slot_date}T${slot.slot_time}`, 'Africa/Kigali');

    if (slotDateTime.isValid()) {
      if (slot.is_saved) {
        const savedTime = dayjs(slot.saved_at);
        if (savedTime.isBefore(slotDateTime)) {
          friendlyStatus = 'saved';
        } else if (savedTime.isAfter(slotDateTime)) {
          friendlyStatus = 'saved but late';
        }
      } else {
        const timeLimit = slotDateTime.add(slot.rule_time_limit_minutes, 'minute');
        if (now.isBefore(slotDateTime)) {
          friendlyStatus = 'upcoming';
        } else if (now.isAfter(timeLimit)) {
          friendlyStatus = 'missed';
        } else if (now.isBetween(slotDateTime, timeLimit)) {
          friendlyStatus = 'pending';
        }
      }
    }

    return friendlyStatus;
  };

  // When slots update, update their friendly_status
  useEffect(() => {
    if (slots && slots.length > 0) {
      const processedSlots = slots.map((slot) => {
        return { ...slot, friendly_status: updateSlotStatus(slot) };
      });
      setSlots(processedSlots);
    }
  }, [slots]);

  // Detect frequency type from slots
  const getFrequencyType = (slots) => {
    if (!slots || slots.length === 0) return null;
    return slots[0].frequency_category?.toLowerCase() || null;
  };

  // ----- New grouping functions -----

  // Monthly grouping starting at first slot date respecting number_of_categories
  const groupSlotsByMonthlyRangesFromFirstSlot = (slots, numberOfCategories = 12) => {
    if (!slots.length) return [];

    const sorted = [...slots].sort((a, b) => dayjs(a.slot_date).diff(dayjs(b.slot_date)));

    const firstSlotDate = dayjs(sorted[0].slot_date).startOf('day');

    const groups = {};

    for (let i = 0; i < numberOfCategories; i++) {
      const start = firstSlotDate.add(i, 'month');
      const end = start.add(1, 'month').subtract(1, 'day');
      const key = start.format('YYYY-MM-DD') + '_' + end.format('YYYY-MM-DD');
      groups[key] = { start, end, slots: [] };
    }

    sorted.forEach((slot) => {
      const slotDate = dayjs(slot.slot_date);
      for (const key in groups) {
        const { start, end } = groups[key];
        if (slotDate.isBetween(start, end, null, '[]')) {
          groups[key].slots.push(slot);
          break;
        }
      }
    });

    return Object.values(groups)
      .map((group, idx) => ({
        title: `🟨 Month ${idx + 1} (${group.start.format('YYYY-MM-DD')} to ${group.end.format('YYYY-MM-DD')})`,
        slots: group.slots,
        isCurrent: dayjs().tz('Africa/Kigali').isBetween(group.start, group.end, null, '[]'),
      }))
      .filter(group => group.slots.length > 0);
  };

  // Weekly grouping starting at first slot date respecting number_of_categories
  const groupSlotsByWeeklyRangesFromFirstSlot = (slots, numberOfCategories = 12) => {
    if (!slots.length) return [];

    const sorted = [...slots].sort((a, b) => dayjs(a.slot_date).diff(dayjs(b.slot_date)));

    const firstSlotDate = dayjs(sorted[0].slot_date).startOf('day');

    const groups = {};

    for (let i = 0; i < numberOfCategories; i++) {
      const start = firstSlotDate.add(i * 7, 'day');
      const end = start.add(6, 'day'); // 7 days total
      const key = start.format('YYYY-MM-DD') + '_' + end.format('YYYY-MM-DD');
      groups[key] = { start, end, slots: [] };
    }

    sorted.forEach((slot) => {
      const slotDate = dayjs(slot.slot_date);
      for (const key in groups) {
        const { start, end } = groups[key];
        if (slotDate.isBetween(start, end, null, '[]')) {
          groups[key].slots.push(slot);
          break;
        }
      }
    });

    return Object.values(groups)
      .map((group, idx) => ({
        title: `🟦 Week ${idx + 1} (${group.start.format('YYYY-MM-DD')} to ${group.end.format('YYYY-MM-DD')})`,
        slots: group.slots,
        isCurrent: dayjs().tz('Africa/Kigali').isBetween(group.start, group.end, null, '[]'),
      }))
      .filter(group => group.slots.length > 0);
  };

  // Daily grouping starting at first slot date respecting number_of_categories (optional)
  const groupSlotsByDailyRangesFromFirstSlot = (slots, numberOfCategories = 12) => {
    if (!slots.length) return [];

    const sorted = [...slots].sort((a, b) => dayjs(a.slot_date).diff(dayjs(b.slot_date)));

    const firstSlotDate = dayjs(sorted[0].slot_date).startOf('day');

    const groups = {};

    for (let i = 0; i < numberOfCategories; i++) {
      const day = firstSlotDate.add(i, 'day');
      const key = day.format('YYYY-MM-DD');
      groups[key] = { day, slots: [] };
    }

    sorted.forEach((slot) => {
      const slotDate = dayjs(slot.slot_date).startOf('day');
      const key = slotDate.format('YYYY-MM-DD');
      if (groups[key]) {
        groups[key].slots.push(slot);
      }
    });

    return Object.values(groups)
      .map((group, idx) => ({
        title: `📅 Day ${idx + 1} (${group.day.format('YYYY-MM-DD')})`,
        slots: group.slots,
        isCurrent: dayjs().tz('Africa/Kigali').isSame(group.day, 'day'),
      }))
      .filter(group => group.slots.length > 0);
  };

  // Determine frequency and group accordingly
  const frequencyType = getFrequencyType(slots);
  const numberOfCategories = slots[0]?.number_of_categories || 12;

  let groupedSlots = [];

  if (frequencyType === 'weekly') {
    groupedSlots = groupSlotsByWeeklyRangesFromFirstSlot(slots, numberOfCategories);
  } else if (frequencyType === 'monthly') {
    groupedSlots = groupSlotsByMonthlyRangesFromFirstSlot(slots, numberOfCategories);
  } else if (frequencyType === 'daily') {
    groupedSlots = groupSlotsByDailyRangesFromFirstSlot(slots, numberOfCategories);
  } else {
    groupedSlots = [{ title: 'All Slots', slots, isCurrent: false }];
  }

  if (!user) return <p>Please log in to access your saving slots.</p>;
  if (loading) return <p>Loading slots...</p>;

  const unpaidPenaltiesCount = slots.filter((slot) => slot.penalty_amount && !slot.penalty_paid).length;

  return (
    <div className="saving-manager">
      <h2>My Saving Slots</h2>

      {unpaidPenaltiesCount > 0 && (
        <p className="penalty-warning">
          ⚠️ You have {unpaidPenaltiesCount} unpaid penalt{unpaidPenaltiesCount === 1 ? 'y' : 'ies'}. Please pay to avoid further punishments.
        </p>
      )}

      {slots.length === 0 ? (
        <p>No saving slots found.</p>
      ) : (
        <>
          {groupedSlots.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className={`slot-group${group.isCurrent ? ' current-group' : ''}`}
              style={{
                marginBottom: '2rem',
                border: group.isCurrent ? '2px solid #3b82f6' : '1px solid #ddd',
                padding: '1rem',
                borderRadius: '6px',
                backgroundColor: group.isCurrent ? '#eff6ff' : 'transparent',
              }}
            >
              <h3>
                {group.title}{' '}
                {group.isCurrent && (
                  <span style={{ color: '#3b82f6', fontWeight: 'bold', marginLeft: '0.5rem' }}>← Current</span>
                )}
              </h3>
              <table className="slots-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Scheduled Time</th>
                    <th>Saved At</th>
                    <th>Amount</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Penalty</th>
                    <th>Penalty Paid</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {group.slots.map((slot) => {
                    const rowStatus = slot.friendly_status || 'upcoming';
                    const savedAt = slot.saved_at
                      ? dayjs(slot.saved_at).tz('Africa/Kigali').format('YYYY-MM-DD HH:mm')
                      : '—';

                    return (
                      <tr key={slot.slot_id} className={`status-${rowStatus}`}>
                        <td>{dayjs(slot.slot_date).format('YYYY-MM-DD')}</td>
                        <td>{slot.slot_time?.slice(0, 5) || '—'}</td>
                        <td>{savedAt}</td>
                        <td>{slot.saved_amount ?? '—'}</td>
                        <td>{slot.phone_used ?? '—'}</td>
                        <td>{rowStatus}</td>
                        <td>{slot.penalty_amount ? `RWF ${slot.penalty_amount}` : '—'}</td>
                        <td className={slot.penalty_amount > 0 ? (slot.penalty_paid ? 'paid' : 'unpaid') : ''}>
                          {slot.penalty_amount > 0 ? (slot.penalty_paid ? '✔ Yes' : 'No') : '—'}
                        </td>

                        <td>
                          {slot.penalty_amount && !slot.penalty_paid ? (
                            <button
                              onClick={() => {
                                setSelectedSlotId(slot.slot_id);
                                setModalPurpose('penalty');
                              }}
                              className="btn-action"
                            >
                              Pay Penalty
                            </button>
                          ) : !slot.is_saved && ['current', 'upcoming', 'missed'].includes(rowStatus) ? (
                            <button
                              onClick={() => {
                                setSelectedSlotId(slot.slot_id);
                                setModalPurpose('save');
                              }}
                              className="btn-action"
                            >
                              Save
                            </button>
                          ) : slot.is_saved ? (
                            rowStatus === 'saved but late' ? '✔ Saved (Late)' : '✔ Saved'
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}

      {selectedSlotId && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {slotDetails ? (
              <>
                <h3>{modalPurpose === 'save' ? 'Submit Saving' : 'Pay Penalty'}</h3>
                <p>
                  <b>Date:</b> {dayjs(slotDetails.slot_date).format('YYYY-MM-DD')}
                </p>
                <p>
                  <b>Scheduled Time:</b> {slotDetails.slot_time?.slice(0, 5) || '—'}
                </p>

                {modalPurpose === 'save' ? (
                  <form onSubmit={handleSubmitAction} noValidate>
                    <label>
                      Amount (Min: {slotDetails.saving_ratio}):
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={slotDetails.saving_ratio}
                        required
                        disabled={saving}
                      />
                    </label>
                    <label>
                      Phone Used (optional):
                      <input
                        type="tel"
                        value={phoneUsed}
                        onChange={(e) => setPhoneUsed(e.target.value)}
                        pattern="\d{10,15}"
                        title="Enter 10 to 15 digits"
                      />
                    </label>
                    <button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Submit Saving'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmitAction} noValidate>
                    <p>
                      <b>Penalty:</b> {slotDetails.penalty_amount ? `RWF ${slotDetails.penalty_amount}` : 'N/A'}
                    </p>
                    <button type="submit" disabled={saving || slotDetails.penalty_paid}>
                      {saving ? 'Paying...' : slotDetails.penalty_paid ? 'Already Paid' : 'Confirm Payment'}
                    </button>
                  </form>
                )}

                {formMessage && (
                  <p
                    className={`form-message ${
                      formMessage.toLowerCase().includes('fail') || formMessage.toLowerCase().includes('error')
                        ? 'error'
                        : 'success'
                    }`}
                  >
                    {formMessage}
                  </p>
                )}
                <button onClick={closeModal} className="btn-cancel">
                  Cancel
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
