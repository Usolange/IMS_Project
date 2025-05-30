import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Members.css';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', email: '', status: '' });
  const [editMode, setEditMode] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Fetch the list of members from the API
  useEffect(() => {
    axios.get('http://localhost:5000/api/members')
      .then(res => setMembers(res.data))
      .catch(err => console.error('Error fetching members:', err));
  }, []);

  // Handle member creation
  const handleAddMember = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/members', newMember)
      .then(res => {
        setMembers([...members, res.data]);
        setNewMember({ name: '', email: '', status: '' });
      })
      .catch(err => console.error('Error adding member:', err));
  };

  // Handle member update (edit)
  const handleEditMember = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:5000/api/members/${editingMember.id}`, newMember)
      .then(res => {
        const updatedMembers = members.map(member =>
          member.id === editingMember.id ? res.data : member
        );
        setMembers(updatedMembers);
        setEditMode(false);
        setNewMember({ name: '', email: '', status: '' });
      })
      .catch(err => console.error('Error updating member:', err));
  };

  // Handle member deletion
  const handleDeleteMember = (id) => {
    axios.delete(`http://localhost:5000/api/members/${id}`)
      .then(() => {
        const filteredMembers = members.filter(member => member.id !== id);
        setMembers(filteredMembers);
      })
      .catch(err => console.error('Error deleting member:', err));
  };

  // Open edit form
  const handleOpenEdit = (member) => {
    setEditMode(true);
    setEditingMember(member);
    setNewMember({ name: member.name, email: member.email, status: member.status });
  };

  return (
    <div className="members-container">
      <h1 className="members-heading">Members List</h1>

      {/* Add/Edit Member Form */}
      <form onSubmit={editMode ? handleEditMember : handleAddMember} className="member-form">
        <input
          type="text"
          placeholder="Name"
          value={newMember.name}
          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={newMember.email}
          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Status"
          value={newMember.status}
          onChange={(e) => setNewMember({ ...newMember, status: e.target.value })}
          required
        />
        <button type="submit">{editMode ? 'Update Member' : 'Add Member'}</button>
      </form>

      <table className="members-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{member.status}</td>
              
              <td>
                <button onClick={() => handleOpenEdit(member)} className="edit-button">Edit</button>
                <button onClick={() => handleDeleteMember(member.id)} className="delete-button">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
