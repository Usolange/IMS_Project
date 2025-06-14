import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../../CSS/AvailableSchedules.css';

const AvailableSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let sad_id = null;

    try {
      const user = JSON.parse(storedUser);
      sad_id = user?.id;
    } catch (err) {
      console.error("Invalid user object in localStorage");
      setError("Invalid user data. Please log in again.");
      setLoading(false);
      return;
    }

    if (!sad_id) {
      setError("User ID missing. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchSchedules = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/dailyTimeRoutes/allSchedules?sad_id=${sad_id}`);
        setSchedules(res.data);
        setError('');
      } catch (err) {
        console.error('Error fetching schedules:', err.response || err.message);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load schedules'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  const getScheduleTimeDisplay = (schedule) => {
    switch (schedule.scheduleType) {
      case 'daily':
        return schedule.dtime_time;
      case 'weekly':
        return `${schedule.weeklytime_day} at ${schedule.weeklytime_time}`;
      case 'monthly':
        return `${schedule.monthlytime_date} at ${schedule.monthlytime_time}`;
      default:
        return '';
    }
  };

  return (
    <div className="schedules-container">
      <Link to="/TimeManager" className="nav-link">Back to LocationManager</Link>
      <h2>Available Ikimina Schedules</h2>

      {loading ? (
        <p>Loading schedules...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : schedules.length === 0 ? (
        <p>No schedules found.</p>
      ) : (
        <table className="schedules-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ikimina Name</th>
              <th>Time / Date Info</th>
              <th>Category ID (f_id)</th>
              <th>Schedule Type</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule, index) => (
              <tr key={schedule.id}>
                <td>{index + 1}</td>
                <td>{schedule.ikimina_name}</td>
                <td>{getScheduleTimeDisplay(schedule)}</td>
                <td>{schedule.f_id}</td>
                <td>{schedule.scheduleType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AvailableSchedules;
