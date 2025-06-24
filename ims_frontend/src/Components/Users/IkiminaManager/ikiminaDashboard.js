// src/Components/Dashboard.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../CSS/adminDashboard.css';

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [gudians, setGudians] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const iki_id = user?.id;

  useEffect(() => {
    fetchAllData();
  }, [iki_id]);

  const fetchAllData = async () => {
    try {
      const [memberRes, gudianRes, typeRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/membersInfoRoutes/select?iki_id=${iki_id}`),
        axios.get('http://localhost:5000/api/gudianMembersRoutes/select', { params: { iki_id } }),
        axios.get('http://localhost:5000/api/memberTypeRoutes/select'),
      ]);
      setMembers(memberRes.data);
      setGudians(gudianRes.data);
      setMemberTypes(typeRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const getMemberType = (id) => {
    const found = memberTypes.find((type) => type.member_type_id === id);
    return found ? found.member_type : 'Unknown';
  };

  const getGudianName = (gmNid) => {
    const found = gudians.find((g) => g.gm_Nid === gmNid);
    return found ? found.gm_names : 'N/A';
  };

  return (
    <div className="dashboard-container">
      <h2>All Members</h2>

      <table className="dashboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Member Names</th>
            <th>National ID</th>
            <th>Guardian Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Type</th>
            <th>Ikimina Name</th>
          </tr>
        </thead>
        <tbody>
          {members.length > 0 ? (
            members.map((m, idx) => (
              <tr key={m.member_id}>
                <td>{idx + 1}</td>
                <td>{m.member_names}</td>
                <td>{m.member_Nid}</td>
                <td>{getGudianName(m.gm_Nid)}</td>
                <td>{m.member_phone_number}</td>
                <td>{m.member_email || '—'}</td>
                <td>{getMemberType(m.member_type_id)}</td>
                <td>{m.iki_name}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                No members found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
