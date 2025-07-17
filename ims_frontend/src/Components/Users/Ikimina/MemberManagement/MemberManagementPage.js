import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../CSS/MemberManagements.css';

import RegisterMemberModal from './RegisterMemberModal';
import EditMemberModal from './EditMemberModal';
import GudianMemberModal from './GudianMemberModal';
import MemberTypeModal from './MemberTypeModal';

export default function MemberManagementPage() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [editMember, setEditMember] = useState(null);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const iki_id = user?.iki_id || user?.id;

  // Fetch members on mount and when refreshed
  useEffect(() => {
    fetchMembers();
  }, []);

  // Fetch members from backend
  const fetchMembers = async () => {
    if (!iki_id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/membersInfoRoutes/select?iki_id=${iki_id}`);
      if (res.data.success) {
        setMembers(res.data.data);
        setFilteredMembers(res.data.data);
      } else {
        setMembers([]);
        setFilteredMembers([]);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
      setMembers([]);
      setFilteredMembers([]);
    }
  };

  // Filter members when searchTerm or members change
  useEffect(() => {
    const filtered = members.filter(m =>
      (m.member_names || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.member_Nid || '').includes(searchTerm) ||
      (m.member_phone_number || '').includes(searchTerm)
    );
    setFilteredMembers(filtered);
    setCurrentPage(1);
  }, [searchTerm, members]);

  // Pagination slice
  const paginated = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredMembers.length / pageSize);

// Edit button handler
  const handleEdit = (member) => {
    setEditMember(member); // This alone is enough to open the modal
  };


  // Delete member handler
  const handleDelete = async (member_id) => {
    try {
      await axios.delete(`http://localhost:5000/api/membersInfoRoutes/delete/${member_id}`, {
        headers: {
          'x-iki-id': iki_id,
        },
      });
      fetchMembers();
      setConfirmDeleteMember(null);
    } catch (err) {
      console.error('Failed to delete member:', err);
    }
  };

  // Close all modals
  const closeModal = () => {
    navigate('/MemberManagementPage');
    setEditMember(null);
    setConfirmDeleteMember(null);
  };

  return (
    <div className="member-management">
      <h2>👥 Member Management</h2>

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
              <th>#</th><th>Full Name</th><th>National ID</th><th>Guardian NID</th>
              <th>Phone</th><th>Email</th><th>Type</th><th>Code</th><th>Ikimina</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length ? (
              paginated.map((m, i) => (
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
                    <button
                      onClick={() => handleEdit(m)}
                      className="action-button"
                      title="Edit this member"
                    >
                      ✏️ Update
                    </button>{' '}
                    <button
                      onClick={() => setConfirmDeleteMember(m)}
                      className="action-button delete"
                      title="Delete this member"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="10">No members found.</td></tr>
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

      {/* Modals */}
      {location.pathname === '/MemberManagementPage/addNewMember' && (
        <RegisterMemberModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={fetchMembers}
          iki_id={iki_id}
        />
      )}

     {editMember && (
        <EditMemberModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={fetchMembers}
          editMember={editMember}
          iki_id={iki_id}
        />
      )}

     

      {location.pathname === '/MemberManagementPage/addGuardianMember' && (
        <GudianMemberModal isOpen={true} onClose={closeModal} onSuccess={fetchMembers} />
      )}

      {location.pathname === '/MemberManagementPage/addMemberType' && (
        <MemberTypeModal isOpen={true} onClose={closeModal} onSuccess={fetchMembers} />
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteMember && (
        <div className="modal-overlay">
          <div className="modal-form">
            <h4>
              Are you sure you want to delete <strong>{confirmDeleteMember.member_names}</strong>?
            </h4>
            <div className="modal-btns">
              <button onClick={() => handleDelete(confirmDeleteMember.member_id)}>Yes, Delete</button>
              <button className="cancel-btn" onClick={() => setConfirmDeleteMember(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Outlet />
    </div>
  );
}
