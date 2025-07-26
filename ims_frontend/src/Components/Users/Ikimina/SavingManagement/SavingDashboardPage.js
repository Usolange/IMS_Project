// src/pages/SavingDashboardPage.js
import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import '../../../CSS/SavingDashboardPage.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';

const SavingDashboardPage = () => {
  const { ikiId } = useOutletContext();
  const [user, setUser] = useState({ id: ikiId, name: null });
  const [membersData, setMembersData] = useState([]);
  const [savingActivities, setSavingActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const memberIdToName = useMemo(() => {
    const map = {};
    membersData.forEach(({ member_id, member_names }) => {
      map[member_id] = member_names;
    });
    return map;
  }, [membersData]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          id: parsedUser.sad_id || parsedUser.id || null,
          name: parsedUser.name || parsedUser.iki_name || parsedUser.username || 'Unknown User',
        });
      } catch {
        setUser({ id: null, name: null });
      }
    }
  }, []);

  useEffect(() => {
    if (!ikiId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [membersRes, savingsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/savingManagementRoutes/ikimina/${ikiId}/summary`, config),
          axios.get(`http://localhost:5000/api/savingManagementRoutes/savings/${ikiId}`, config),
        ]);

        setMembersData(membersRes.data);
        setSavingActivities(savingsRes.data);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load saving info.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ikiId, token]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      {/* Chart */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Total Savings</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={membersData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="member_names" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total_savings" fill="#3182ce" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Table */}
      <section className="mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-2">Saving Activities</h2>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Amount</th>
              <th>Saved At</th>
              <th>Penalty?</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {savingActivities.map(a => (
              <tr key={a.save_id} className="hover:bg-gray-50">
                <td>{memberIdToName[a.member_id] || a.member_id}</td>
                <td>{a.saved_amount.toLocaleString()}</td>
                <td>{new Date(a.saved_at).toLocaleString()}</td>
                <td>{a.penalty_applied ? 'Yes' : 'No'}</td>
                <td>{a.phone_used}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default SavingDashboardPage;
