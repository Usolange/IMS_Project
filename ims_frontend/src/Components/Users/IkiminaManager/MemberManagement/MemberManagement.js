// MemberManagement.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RegisterMemberModal from './RegisterMemberModal';
import GudianMemberModal from './GudianMemberModal';
import MemberTypeModal from './MemberTypeModal';
import * as XLSX from 'xlsx';
import '../../../CSS/MemberManagements.css';

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddGudian, setShowAddGudian] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const iki_id = user?.id || user?.iki_id;

  const fetchMembers = async () => {
    if (!iki_id) {
      setMembers([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/membersInfoRoutes/select?iki_id=${iki_id}`);
      if (res.data.success) {
        setMembers(res.data.data);
        setFilteredMembers(res.data.data);
      } else {
        console.error(res.data.message);
        setMembers([]);
        setFilteredMembers([]);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
      setMembers([]);
      setFilteredMembers([]);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [iki_id]);

  useEffect(() => {
    const filtered = members.filter((m) =>
      (m.member_names || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.member_Nid || '').includes(searchTerm) ||
      (m.member_phone_number || '').includes(searchTerm)
    );
    setFilteredMembers(filtered);
    setCurrentPage(1);
  }, [searchTerm, members]);

  const handleDelete = async (member_id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/membersInfoRoutes/${member_id}`, {
        data: { iki_id },
      });
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

  const exportToExcel = () => {
    const cleanData = filteredMembers.map(({ member_id, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, 'Ikimina_Members.xlsx');
  };

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredMembers.length / pageSize);

  return (
    <div className="member-management">
      <h2>👥 Member Management</h2>

      <div className="action-buttons">
        <button onClick={() => setShowAddType(true)}>🏷️ Add Member Type</button>
        <button onClick={() => setShowAddGudian(true)}>👨‍👦 Add Guardian Member</button>
        <button onClick={() => setShowAddMember(true)}>➕ Add New Member</button>
        <button onClick={exportToExcel}>📥 Export to Excel</button>
        <a href="/ikiminaDashboard" className="btn-primary">Back</a>
      </div>

      <input
        type="text"
        placeholder="Search by name, NID, or phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>National ID</th>
              <th>Guardian NID</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Type</th>
              <th>Code</th>
              <th>Ikimina</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((m, i) => (
                <tr key={m.member_id}>
                  <td>{(currentPage - 1) * pageSize + i + 1}</td>
                  <td>{m.member_names}</td>
                  <td>{m.member_Nid || '—'}</td>
                  <td>{m.gm_Nid || '—'}</td>
                  <td>{m.member_phone_number}</td>
                  <td>{m.member_email || '—'}</td>
                  <td>{m.member_type || '—'}</td>
                  <td>{m.member_code || '—'}</td>
                  <td>{m.iki_name || '—'}</td>
                  <td>
                    <button className="edit-btn" onClick={() => openEditModal(m)}>✏️</button>
                    <button className="delete-btn" onClick={() => handleDelete(m.member_id)}>🗑️</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10">No members found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={currentPage === i + 1 ? 'active' : ''}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
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
