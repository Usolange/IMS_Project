import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RegisterMemberModal from './RegisterMemberModal';
import GudianMemberModal from './GudianMemberModal';
import MemberTypeModal from './MemberTypeModal';
import '../../../CSS/MemberManagement.css';

// Toast component
function Toast({ message, type = 'info', onClose }) {
  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="assertive" aria-atomic="true">
      <span>{message}</span>
      <button onClick={onClose} className="toast-close-btn" aria-label="Close notification">
        ×
      </button>
    </div>
  );
}

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [gudians, setGudians] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddGudian, setShowAddGudian] = useState(false);
  const [showEditGudian, setShowEditGudian] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [editGudian, setEditGudian] = useState(null);

  const [memberPage, setMemberPage] = useState(1);
  const [gudianPage, setGudianPage] = useState(1);
  const [memberRowsPerPage, setMemberRowsPerPage] = useState(10);
  const [gudianRowsPerPage, setGudianRowsPerPage] = useState(10);

  const [memberSearch, setMemberSearch] = useState('');
  const [gudianSearch, setGudianSearch] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const iki_id = user?.id;
  const iki_name = user?.name || '';
  const cell = user?.cell || '';
  const village = user?.village || '';
  const sector = user?.sector || '';

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => setToast({ message, type });
  const closeToast = () => setToast(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(closeToast, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchMembers = async () => {
    if (!iki_id) {
      setMembers([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/membersInfoRoutes/select?iki_id=${iki_id}`);
      setMembers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      showToast('Failed to load members', 'error');
      setMembers([]);
    }
  };

  const fetchGudians = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/gudianMembersRoutes/select?iki_id=${iki_id}`);
      setGudians(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('Failed to load guardian members', 'error');
      setGudians([]);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchGudians();
  }, [iki_id]);

  const handleDelete = async (member_id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/membersInfoRoutes/${member_id}`, { data: { iki_id } });
      showToast('Member deleted successfully', 'success');
      fetchMembers();
    } catch {
      showToast('Failed to delete member', 'error');
    }
  };

  const handleDeleteGudian = async (gm_id, gm_Nid) => {
    if (!window.confirm('Are you sure you want to delete this guardian member?')) return;
    try {
      const checkRes = await axios.get(
        `http://localhost:5000/api/gudianMembersRoutes/check-assigned/${gm_Nid}`
      );
      if (checkRes.data.assignedCount > 0) {
        showToast('Cannot delete guardian: Assigned to existing members.', 'error');
        return;
      }
      await axios.delete(`http://localhost:5000/api/gudianMembers/${gm_id}`);
      showToast('Guardian member deleted successfully', 'success');
      fetchGudians();
    } catch {
      showToast('Failed to delete guardian member', 'error');
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

  const openEditGudianModal = (gudian) => {
    setEditGudian(gudian);
    setShowEditGudian(true);
  };
  const closeEditGudianModal = () => {
    setShowEditGudian(false);
    setEditGudian(null);
  };

  const paginate = (data, page, rowsPerPage) => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  };

  const filteredMembers = Array.isArray(members)
    ? members.filter((m) =>
        `${m.member_names} ${m.member_Nid} ${m.member_email}`.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : [];

  const filteredGudians = Array.isArray(gudians)
    ? gudians.filter((g) =>
        `${g.gm_names} ${g.gm_Nid} ${g.gm_phonenumber}`.toLowerCase().includes(gudianSearch.toLowerCase())
      )
    : [];

  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / memberRowsPerPage));
  const totalGudianPages = Math.max(1, Math.ceil(filteredGudians.length / gudianRowsPerPage));

  return (
    <div className="member-management-container">
      <h2 className="page-title">👥 Member Management</h2>

      <div className="actions-bar">
        <button onClick={() => setShowAddType(true)} className="action-btn">🏷️ Add Member Type</button>
        <button onClick={() => setShowAddGudian(true)} className="action-btn">👨‍👦 Add Guardian Member</button>
        <button onClick={() => setShowAddMember(true)} className="action-btn">➕ Add New Member</button>
        <a href="/ikiminaDashboard" className="btn-primary action-btn">Back</a>
      </div>

      {/* Members Section */}
      <section className="members-section">
        <div className="section-header">
          <h3 className="section-title">🧾 Registered Members</h3>
          <input
            type="text"
            placeholder="🔍 Search members..."
            className="search-input"
            value={memberSearch}
            onChange={(e) => {
              setMemberSearch(e.target.value);
              setMemberPage(1);
            }}
          />
          <div className="rows-per-page-container">
            <label htmlFor="memberRowsSelect">Rows per page:</label>
            <select
              id="memberRowsSelect"
              className="rows-per-page-select"
              value={memberRowsPerPage}
              onChange={(e) => {
                setMemberRowsPerPage(parseInt(e.target.value, 10));
                setMemberPage(1);
              }}
            >
              {[5, 10, 25, 50, 100].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Full Name</th>
                <th>NID</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Guardian NID</th>
                <th>Type</th>
                <th>Ikimina</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(filteredMembers, memberPage, memberRowsPerPage).map((m, i) => (
                <tr key={m.member_id}>
                  <td>{(memberPage - 1) * memberRowsPerPage + i + 1}</td>
                  <td>{m.member_names || 'None'}</td>
                  <td>{m.member_Nid || m.guardian_name || 'None'}</td>
                  <td>{m.member_phone_number || 'None'}</td>
                  <td>{m.member_email || 'None'}</td>
                  <td>{m.gm_Nid || 'None'}</td>
                  <td>{m.member_type || m.member_type_id || 'None'}</td>
                  <td>{m.iki_name || m.iki_id || 'None'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEditModal(m)} title="Edit Member">✏️</button>
                    <button className="btn-delete" onClick={() => handleDelete(m.member_id)} title="Delete Member">🗑️</button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan="9" className="no-data">No matching members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <button disabled={memberPage === 1} onClick={() => setMemberPage(memberPage - 1)} className="pagination-btn">Previous</button>
          <span className="pagination-info">Page {memberPage} of {totalMemberPages}</span>
          <button disabled={memberPage === totalMemberPages} onClick={() => setMemberPage(memberPage + 1)} className="pagination-btn">Next</button>
        </div>
      </section>

      {/* Guardian Members Section */}
      <section className="gudians-section">
        <div className="section-header">
          <h3 className="section-title">👨‍👧 Guardian Members</h3>
          <input
            type="text"
            placeholder="🔍 Search guardian members..."
            className="search-input"
            value={gudianSearch}
            onChange={(e) => {
              setGudianSearch(e.target.value);
              setGudianPage(1);
            }}
          />
          <div className="rows-per-page-container">
            <label htmlFor="gudianRowsSelect">Rows per page:</label>
            <select
              id="gudianRowsSelect"
              className="rows-per-page-select"
              value={gudianRowsPerPage}
              onChange={(e) => {
                setGudianRowsPerPage(parseInt(e.target.value, 10));
                setGudianPage(1);
              }}
            >
              {[5, 10, 25, 50, 100].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Names</th>
                <th>NID</th>
                <th>Phone</th>
                <th>Ikimina ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginate(filteredGudians, gudianPage, gudianRowsPerPage).map((g, i) => (
                <tr key={g.gm_id}>
                  <td>{(gudianPage - 1) * gudianRowsPerPage + i + 1}</td>
                  <td>{g.gm_names || 'None'}</td>
                  <td>{g.gm_Nid || 'None'}</td>
                  <td>{g.gm_phonenumber || 'None'}</td>
                  <td>{g.iki_id || 'None'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEditGudianModal(g)} title="Edit Guardian Member">✏️</button>
                    <button className="btn-delete" onClick={() => handleDeleteGudian(g.gm_id, g.gm_Nid)} title="Delete Guardian Member">🗑️</button>
                  </td>
                </tr>
              ))}
              {filteredGudians.length === 0 && (
                <tr>
                  <td colSpan="6" className="no-data">No matching guardian members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <button disabled={gudianPage === 1} onClick={() => setGudianPage(gudianPage - 1)} className="pagination-btn">Previous</button>
          <span className="pagination-info">Page {gudianPage} of {totalGudianPages}</span>
          <button disabled={gudianPage === totalGudianPages} onClick={() => setGudianPage(gudianPage + 1)} className="pagination-btn">Next</button>
        </div>
      </section>

      <RegisterMemberModal
        isOpen={showAddMember}
        onClose={closeMemberModal}
        onSuccess={() => {
          fetchMembers();
          closeMemberModal();
          showToast('Member saved successfully', 'success');
        }}
        editMember={editMember}
        iki_id={iki_id}
        iki_name={iki_name}
        cell={cell}
        village={village}
        sector={sector}
      />

      <GudianMemberModal
        isOpen={showAddGudian}
        onClose={() => setShowAddGudian(false)}
        onSuccess={() => {
          fetchGudians();
          showToast('Guardian member saved successfully', 'success');
        }}
        iki_id={iki_id}
      />

      {showEditGudian && (
        <GudianMemberModal
          isOpen={showEditGudian}
          onClose={closeEditGudianModal}
          onSuccess={() => {
            fetchGudians();
            closeEditGudianModal();
            showToast('Guardian member updated successfully', 'success');
          }}
          editGudian={editGudian}
          iki_id={iki_id}
        />
      )}

      <MemberTypeModal
        isOpen={showAddType}
        onClose={() => setShowAddType(false)}
        onSuccess={() => {
          showToast('Member type saved successfully', 'success');
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
}
