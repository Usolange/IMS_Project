import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditUserForm from './EditUserForm';
import '../CSS/EditUserForm.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

 


  useEffect(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    const parsedUser = JSON.parse(userData);
    console.log(parsedUser);  // Debugging line to see the user data
    setUser(parsedUser);
  }
}, []);

  const handleEditClick = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);

  const handleSave = async (updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        http://localhost:5000/api/supperAdmin/${user.id},
        updatedData,
        {
          headers: {
            Authorization: Bearer ${token}
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
            <td>{user.name}</td>
          </tr>
          <tr>
            <th>Email:</th>
            <td>{user.email}</td>
          </tr>
          <tr>
            <th>Username:</th>
            <td>{user.username}</td>
          </tr>
          <tr>
            <th>Phone:</th>
            <td>{user.phone || '-'}</td>
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