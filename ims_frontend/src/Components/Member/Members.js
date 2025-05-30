import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MemberForm from './MemberForm';
import MemberTable from './MemberTable';
import '../css/Members.css';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', email: '', status: '' });
  const [editMode, setEditMode] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch members on initial load
  useEffect(() => {
    axios.get('http://localhost:5000/api/MemberData')
      .then(res => setMembers(res.data))
      .catch(err => console.error('Error fetching members:', err));
  }, []);

  // Handle adding a new member
  const handleAddMember = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/MemberData', newMember)
      .then(res => {
        setMembers([...members, res.data]);
        resetForm();
      })
      .catch(err => console.error('Error adding member:', err));
  };

  // Handle editing a member
  const handleEditMember = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:5000/api/MemberData/${editingMember.id}`, newMember)
      .then(res => {
        const updated = members.map(m => m.id === editingMember.id ? res.data : m);
        setMembers(updated);
        resetForm();
      })
      .catch(err => console.error('Error updating member:', err));
  };

  // Handle deleting a member
  const handleDeleteMember = (id) => {
    axios.delete(`http://localhost:5000/api/MemberData/${id}`)
      .then(() => setMembers(members.filter(m => m.id !== id)))
      .catch(err => console.error('Error deleting member:', err));
  };

  // Open Add Member Form
  const handleOpenAdd = () => {
    setEditMode(false);
    setNewMember({ name: '', email: '', status: '' });
    setShowForm(true);
  };

  // Open Edit Member Form
  const handleOpenEdit = (member) => {
    setEditMode(true);
    setEditingMember(member);
    setNewMember({ name: member.name, email: member.email, status: member.status });
    setShowForm(true);
  };

  // Reset form fields and close form
  const resetForm = () => {
    setEditMode(false);
    setEditingMember(null);
    setNewMember({ name: '', email: '', status: '' });
    setShowForm(false);
  };

  return (
    <div className="members-container">
      <h1 className="members-heading">Members List</h1>
      <button className="add-member-btn" onClick={handleOpenAdd}>+ Add Member</button>

      <MemberTable
        members={members}
        handleOpenEdit={handleOpenEdit}
        handleDeleteMember={handleDeleteMember}
      />

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={resetForm}>×</button>
            <h2>{editMode ? 'Edit Member' : 'Add Member'}</h2>
            <MemberForm
              member={newMember}
              setMember={setNewMember}
              handleSubmit={editMode ? handleEditMember : handleAddMember}
              editMode={editMode}
            />
          </div>
        </div>
      )}
    </div>
  );
}
