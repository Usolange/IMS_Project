import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

const SavingManagementPage = () => {
  const [user, setUser] = useState({ id: null, name: null });
  const [membersData, setMembersData] = useState([]);
  const [savingActivities, setSavingActivities] = useState([]);
  const [loanInterests, setLoanInterests] = useState([]);
  const [loanRepayments, setLoanRepayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [savingSlots, setSavingSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

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

  const iki_id = user.id;

  // Map member_id → member_names for display in saving activities table
  const memberIdToName = useMemo(() => {
    const map = {};
    membersData.forEach(({ member_id, member_names }) => {
      map[member_id] = member_names;
    });
    return map;
  }, [membersData]);

  useEffect(() => {
    if (!iki_id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [
          membersRes,
          savingsRes,
          interestRes,
          repaymentsRes,
          loansRes,
          slotsRes,
        ] = await Promise.all([
          axios.get(`http://localhost:5000/api/savingManagementRoutes/ikimina/${iki_id}/summary`, config),
          axios.get(`http://localhost:5000/api/savingManagementRoutes/savings/${iki_id}`, config),
          axios.get(`http://localhost:5000/api/savingManagementRoutes/loan-interest/${iki_id}`, config),
          axios.get(`http://localhost:5000/api/savingManagementRoutes/loan-repayments/${iki_id}`, config),
          axios.get(`http://localhost:5000/api/savingManagementRoutes/loans/${iki_id}`, config),
          axios.get(`http://localhost:5000/api/savingManagementRoutes/saving-slots/${iki_id}`, config),
        ]);

        setMembersData(membersRes.data);
        setSavingActivities(savingsRes.data);
        setLoanInterests(interestRes.data);
        setLoanRepayments(repaymentsRes.data);
        setLoans(loansRes.data);
        setSavingSlots(slotsRes.data);
      } catch (err) {
        console.error('Error loading saving management data:', err);
        setError('Failed to load saving information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [iki_id, token]);

  if (!iki_id) return <p className="p-4 text-gray-600">Loading user info...</p>;
  if (loading) return <p className="p-4 text-gray-600">Loading saving information...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-blue-800">Saving Management</h1>

      {/* Total Savings Chart */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Statistics: Total Savings</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={membersData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="member_names" />
            <YAxis />
            <Tooltip formatter={(val) => val.toLocaleString()} />
            <Bar dataKey="total_savings" fill="#3182ce" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Members Summary Table */}
      <section className="mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-2">Members Summary</h2>
        <table className="min-w-full bg-white rounded shadow">
          <thead className="bg-blue-100 text-sm text-gray-700">
            <tr>
              <th className="p-2">Names</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Total Savings</th>
              <th className="p-2">Penalties</th>
              <th className="p-2">Approved Loans</th>
              <th className="p-2">Active Loans</th>
            </tr>
          </thead>
          <tbody>
            {membersData.map(member => (
              <tr key={member.member_id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-2">{member.member_names}</td>
                <td className="p-2">{member.member_phone_number}</td>
                <td className="p-2">{member.total_savings.toLocaleString()}</td>
                <td className="p-2">{member.total_penalties}</td>
                <td className="p-2">{member.total_approved_loans.toLocaleString()}</td>
                <td className="p-2">{member.active_loans.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Saving Activities Table */}
      <section className="mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-2">Savings Activities</h2>
        <table className="min-w-full bg-white rounded shadow">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-2">Member</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Saved At</th>
              <th className="p-2">Penalty?</th>
              <th className="p-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {savingActivities.map(activity => (
              <tr key={activity.save_id} className="text-sm hover:bg-gray-50">
                <td className="p-2">{memberIdToName[activity.member_id] || activity.member_id}</td>
                <td className="p-2">{activity.saved_amount.toLocaleString()}</td>
                <td className="p-2">{new Date(activity.saved_at).toLocaleString()}</td>
                <td className="p-2">{activity.penalty_applied ? 'Yes' : 'No'}</td>
                <td className="p-2">{activity.phone_used}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* You can add similar tables or charts for loanInterests, loanRepayments, loans, and savingSlots */}

    </div>
  );
};

export default SavingManagementPage;
