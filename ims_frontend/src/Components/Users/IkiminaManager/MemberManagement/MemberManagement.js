import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RegisterMemberModal from './RegisterMemberModal';
import GudianMemberModal from './GudianMemberModal';
import MemberTypeModal from './MemberTypeModal';
import '../../../CSS/MemberManagement.css';

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddGudian, setShowAddGudian] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const iki_id = user?.id;

  const fetchMembers = async () => {
    if (!iki_id) {
      setMembers([]);
      return;
    }
    try {
      const res = await axios.get(
        `http://localhost:5000/api/membersInfoRoutes/select?iki_id=${iki_id}`
      );
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to load members', err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [iki_id]);

  const handleDelete = async (member_id) => {
    if (!window.confirm('Are you sure you want to delete this member?'))
      return;
    try {
      await axios.delete(
        `http://localhost:5000/api/membersInfoRoutes/${member_id}`,
        { data: { iki_id } }
      );
      fetchMembers();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const openEditModal = (member) => {
    setEditMember(member);
    setShowAddMember(true);
  };

  const closeMemberModal = () => {
    setShowAddMember(false);
    setEditMember(null);
  };

  return (
    <div className="member-management">
      <h2>👥 Member Management</h2>

      <div className="action-buttons">
        <button onClick={() => setShowAddType(true)}>
          🏷️ Add Member Type
        </button>
        <button onClick={() => setShowAddGudian(true)}>
          👨‍👦 Add Guardian Member
        </button>
        <button onClick={() => setShowAddMember(true)}>
          ➕ Add New Member
        </button>
        <a href="/ikiminaDashboard" className="btn-primary">
          Back
        </a>
      </div>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Full Name</th>
              <th>NID</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Guardian NID</th>
              <th>Type ID</th>
              <th>Ikimina ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map((m, i) => (
                <tr key={m.member_id}>
                  <td>{i + 1}</td>
                  <td>{m.member_names}</td>
                  <td>{m.member_Nid}</td>
                  <td>{m.member_phone_number}</td>
                  <td>{m.member_email}</td>
                  <td>{m.gm_Nid}</td>
                  <td>{m.member_type_id}</td>
                  <td>{m.iki_id}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => openEditModal(m)}
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(m.member_id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9">No members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RegisterMemberModal
        isOpen={showAddMember}
        onClose={closeMemberModal}
        onSuccess={() => {
          fetchMembers();
          closeMemberModal();
        }}
        editMember={editMember}
        iki_id={iki_id}
      />

      <GudianMemberModal
        isOpen={showAddGudian}
        onClose={() => setShowAddGudian(false)}
        onSuccess={fetchMembers}
        iki_id={iki_id}
      />

      <MemberTypeModal
        isOpen={showAddType}
        onClose={() => setShowAddType(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
