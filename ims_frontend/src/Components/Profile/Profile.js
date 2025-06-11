import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditUserForm from './EditUserForm';
import '../CSS/EditUserForm.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({}); // For error messages

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleEditClick = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);

  const handleSave = async (updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/supperAdmin/${user.id}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Profile update failed. Please try again.');
    }
  };

  const handleFieldChange = (e) => {
    // Reset error message when the user starts typing
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  if (!user) {
    return <p>Loading user information...</p>;
  }

  return (
    <div className="profile-container">
      <h2>User Profile</h2>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <table className="profile-table">
        <tbody>
          <tr>
            <th>Full Name:</th>
            <td>
              <input
                name="name"
                type="text"
                value={user.name}
                onChange={handleFieldChange}
                className="form-input"
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </td>
          </tr>
          <tr>
            <th>Email:</th>
            <td>
              <input
                name="email"
                type="email"
                value={user.email}
                onChange={handleFieldChange}
                className="form-input"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </td>
          </tr>
          <tr>
            <th>Username:</th>
            <td>
              <input
                name="username"
                type="text"
                value={user.username}
                onChange={handleFieldChange}
                className="form-input"
              />
              {errors.username && <div className="form-error">{errors.username}</div>}
            </td>
          </tr>
          <tr>
            <th>Phone:</th>
            <td>
              <input
                name="phone"
                type="text"
                value={user.phone || ''}
                onChange={handleFieldChange}
                className="form-input"
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      <button onClick={handleEditClick} className="edit-profile-btn">
        Edit Profile
      </button>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditUserForm
              user={user}
              onCancel={handleCancel}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  );
}
