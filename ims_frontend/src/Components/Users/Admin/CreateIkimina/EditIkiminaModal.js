import React, { useState } from 'react';
import axios from 'axios';
import '../../../CSS/EditIkiminaModal.css';

const EditIkiminaModal = ({ ikimina, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    iki_name: ikimina.iki_name,
    iki_email: ikimina.iki_email,
    iki_username: ikimina.iki_username,
    dayOfEvent: ikimina.dayOfEvent,
    timeOfEvent: ikimina.timeOfEvent,
    numberOfEvents: ikimina.numberOfEvents,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getSadId = () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      const user = JSON.parse(storedUser);
      return user?.sad_id || user?.id || null;
    } catch {
      return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const sad_id = getSadId();
    if (!sad_id) {
      setError('User not logged in');
      return;
    }

    const { iki_name, iki_email, iki_username, dayOfEvent, timeOfEvent, numberOfEvents } = formData;

    if (!iki_name || !iki_email || !iki_username || !dayOfEvent || !timeOfEvent || !numberOfEvents) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `http://localhost:5000/api/ikiminaInfo/update/${ikimina.iki_id}`,
        { iki_name, iki_email, iki_username, dayOfEvent, timeOfEvent, numberOfEvents },
        { headers: { 'x-sad-id': sad_id } }
      );
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update Ikimina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Ikimina</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Ikimina Name</label>
          <input name="iki_name" value={formData.iki_name} onChange={handleChange} />

          <label>Email</label>
          <input name="iki_email" value={formData.iki_email} onChange={handleChange} type="email" />

          <label>Username</label>
          <input name="iki_username" value={formData.iki_username} onChange={handleChange} />

          <label>Day of Event</label>
          <input name="dayOfEvent" value={formData.dayOfEvent} onChange={handleChange} />

          <label>Time of Event</label>
          <input name="timeOfEvent" value={formData.timeOfEvent} onChange={handleChange} type="time" />

          <label>Number of Events</label>
          <input name="numberOfEvents" value={formData.numberOfEvents} onChange={handleChange} type="number" />

          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </button>
            <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIkiminaModal;
