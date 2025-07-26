import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../../CSS/LoanInfoPage.css'

const LoanInfoPage = () => {
  const [loans, setLoans] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('current');
  const [ikiName, setIkiName] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch rounds for filter dropdown
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) return;
        const iki_id = user.id;
        setIkiName(user.name);

        const res = await axios.get(`http://localhost:5000/api/savingRulesRoutes/rounds/forikimina/${iki_id}`);
        setRounds(res.data);
      } catch {
        alert('Failed to load Ikimina rounds');
      }
    };
    fetchRounds();
  }, []);

  // Fetch loans on mount and round change
  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          alert('Ikimina user not found. Please log in again.');
          return;
        }

        const iki_id = user.id;
        const params = {};
        if (selectedRoundId === 'current') params.mode = 'current';
        else if (selectedRoundId !== 'all') params.round_id = selectedRoundId;

        const response = await axios.get(`http://localhost:5000/api/savingRulesRoutes/loans/forikimina/${iki_id}`, { params });
        setLoans(response.data);
      } catch (error) {
        console.error('Error fetching loans:', error);
        alert('Failed to load loan information.');
      }
      setLoading(false);
    };

    fetchLoans();
  }, [selectedRoundId]);

  // Format date with Kigali timezone
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { timeZone: 'Africa/Kigali' });
  };

  return (
    <div className="loan-info-container">
      <h2>Loans for Ikimina: <span className="ikimina-name">{ikiName}</span></h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>Filter by Round:</label>{' '}
        <select value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)}>
          <option value="current">Current Round (Active/Completed)</option>
          <option value="all">All Rounds</option>
          {rounds.map(r => (
            <option key={r.round_id} value={r.round_id}>
              Round {r.round_number} ({r.round_year}) - {r.round_status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading loans...</p>
      ) : loans.length === 0 ? (
        <p>No loans found for this Ikimina.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Round</th>
              <th>Requested Amount</th>
              <th>Approved Amount</th>
              <th>Loan Status</th>
              <th>Request Date</th>
              <th>Approval Date</th>
              <th>Disbursed Date</th>
              <th>Due Date</th>
              <th>Repayment Completed</th>
              <th>Latest Balance</th>
              <th>Latest Interest Added</th>
              <th>Latest Interest Date</th>
              <th>Last Payment Amount</th>
              <th>Payment Date</th>
              <th>Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan.loan_id}>
                <td>{loan.member_names}</td>
                <td>{loan.round_number} ({loan.round_year})</td>
                <td>{loan.requested_amount}</td>
                <td>{loan.approved_amount}</td>
                <td>{loan.loan_status}</td>
                <td>{formatDate(loan.request_date)}</td>
                <td>{formatDate(loan.approval_date)}</td>
                <td>{formatDate(loan.disbursed_date)}</td>
                <td>{formatDate(loan.due_date)}</td>
                <td>{loan.repayment_completed_date ? formatDate(loan.repayment_completed_date) : '-'}</td>
                <td>{loan.latest_remaining_balance ?? '-'}</td>
                <td>{loan.latest_interest_added ?? '-'}</td>
                <td>{loan.latest_interest_applied_date ? formatDate(loan.latest_interest_applied_date) : '-'}</td>
                <td>{loan.latest_amount_paid ?? '-'}</td>
                <td>{loan.latest_payment_date ? formatDate(loan.latest_payment_date) : '-'}</td>
                <td>{loan.latest_payment_status ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LoanInfoPage;
