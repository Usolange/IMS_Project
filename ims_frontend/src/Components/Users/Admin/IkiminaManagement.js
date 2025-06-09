import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../CSS/IkiminaManagement.css';

export default function IkiminaManagement() {
  const [categories, setCategories] = useState([]);
  const [ikiminaData, setIkiminaData] = useState({
    iki_name: '',
    iki_email: '',
    iki_username: '',
    iki_password: '',
    iki_location: '',
    f_id: '',  // This will store the ID of the selected frequency category
    iki_date: new Date(),
  });

  const [timeDetails, setTimeDetails] = useState({
    dailyTime: '',
    weeklyDay: '',
    weeklyTime: '',
    monthlyDate: new Date(),
    monthlyTime: '',
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/frequencyCategory')
      .then(res => {
        setCategories(res.data);  // Saving both f_id and f_category
      })
      .catch(err => console.error('Error loading categories:', err));
  }, []);

  const handleIkiminaChange = (e) => {
    setIkiminaData({ ...ikiminaData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...ikiminaData,
      timeDetails,
    };

    try {
      await axios.post('http://localhost:5000/api/ikimina', payload);
      alert('Ikimina created successfully!');
    } catch (err) {
      console.error('Error creating ikimina:', err);
      alert('Error creating ikimina');
    }
  };

  return (
    <div className="ik-form-container">
      <h2 className="ik-form-title">Create New Ikimina</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="iki_name"
          placeholder="Group Name"
          value={ikiminaData.iki_name}
          onChange={handleIkiminaChange}
          className="ik-form-input"
          required
        />
        <input
          name="iki_email"
          placeholder="Email"
          value={ikiminaData.iki_email}
          onChange={handleIkiminaChange}
          className="ik-form-input"
          required
        />
        <input
          name="iki_username"
          placeholder="Username"
          value={ikiminaData.iki_username}
          onChange={handleIkiminaChange}
          className="ik-form-input"
          required
        />
        <input
          name="iki_password"
          type="password"
          placeholder="Password"
          value={ikiminaData.iki_password}
          onChange={handleIkiminaChange}
          className="ik-form-input"
          required
        />
        <input
          name="iki_location"
          placeholder="Location"
          value={ikiminaData.iki_location}
          onChange={handleIkiminaChange}
          className="ik-form-input"
          required
        />

        <label className="ik-form-label">Select Frequency Category</label>
        <select
          name="f_id"
          value={ikiminaData.f_id}
          onChange={handleIkiminaChange}
          className="ik-form-input"
          required
        >
          <option value="">-- Select Frequency --</option>
          {categories.map((cat) => (
            <option key={cat.f_id} value={cat.f_id}>
              {cat.f_category} {/* Display the category name */}
            </option>
          ))}
        </select>

        {ikiminaData.f_id === '2' && (
          <>
            <label className="ik-form-label">Time (Daily)</label>
            <input
              type="time"
              value={timeDetails.dailyTime}
              onChange={(e) => setTimeDetails({ ...timeDetails, dailyTime: e.target.value })}
              className="ik-form-input"
              required
            />
          </>
        )}

        {ikiminaData.f_id === '3' && (
          <>
            <label className="ik-form-label">Day of Week (Weekly)</label>
            <select
              value={timeDetails.weeklyDay}
              onChange={(e) => setTimeDetails({ ...timeDetails, weeklyDay: e.target.value })}
              className="ik-form-input"
              required
            >
              <option value="">-- Select Day --</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>

            <label className="ik-form-label">Time</label>
            <input
              type="time"
              value={timeDetails.weeklyTime}
              onChange={(e) => setTimeDetails({ ...timeDetails, weeklyTime: e.target.value })}
              className="ik-form-input"
              required
            />
          </>
        )}

        {ikiminaData.f_id === '4' && (
          <>
            <label className="ik-form-label">Date (Monthly)</label>
            <DatePicker
              selected={timeDetails.monthlyDate}
              onChange={(date) => setTimeDetails({ ...timeDetails, monthlyDate: date })}
              dateFormat="dd/MM/yyyy"
              className="ik-form-input"
              required
            />

            <label className="ik-form-label">Time</label>
            <input
              type="time"
              value={timeDetails.monthlyTime}
              onChange={(e) => setTimeDetails({ ...timeDetails, monthlyTime: e.target.value })}
              className="ik-form-input"
              required
            />
          </>
        )}

        <button type="submit" className="ik-form-button">
          Create Ikimina
        </button>
      </form>
    </div>
  );
}
