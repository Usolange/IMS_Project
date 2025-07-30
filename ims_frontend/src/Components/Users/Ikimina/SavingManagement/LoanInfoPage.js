import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../../CSS/LoanInfoPage.css';

const LoanInfoPage = () => {
  const [loans, setLoans] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('current');
  const [ikiName, setIkiName] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [requestFrom, setRequestFrom] = useState('');
  const [requestTo, setRequestTo] = useState('');
  const [paymentFrom, setPaymentFrom] = useState('');
  const [paymentTo, setPaymentTo] = useState('');

  // Fetch rounds and user name once on mount
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) return;
        setIkiName(user.name);

        const res = await axios.get(
          `http://localhost:5000/api/savingRulesRoutes/rounds/forikimina/${user.id}`
        );
        setRounds(res.data);
      } catch {
        alert('Failed to load Ikimina rounds');
      }
    };
    fetchRounds();
  }, []);

  // Fetch loans with current filters
  const fetchLoans = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        alert('Ikimina user not found. Please log in again.');
        setLoading(false);
        return;
      }

      const params = {};
      if (selectedRoundId === 'current') params.mode = 'current';
      else if (selectedRoundId !== 'all') params.round_id = selectedRoundId;

      if (statusFilter) params.status = statusFilter.toLowerCase();
      if (requestFrom) params.request_from = requestFrom;
      if (requestTo) params.request_to = requestTo;
      if (paymentFrom) params.payment_from = paymentFrom;
      if (paymentTo) params.payment_to = paymentTo;

      const response = await axios.get(
        `http://localhost:5000/api/savingRulesRoutes/loans/forikimina/${user.id}`,
        { params }
      );

      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
      alert('Failed to load loan information.');
    }
    setLoading(false);
  };

  // Fetch loans initially and when round changes
  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoundId]);

  // Format dates as dd/mm/yyyy with Kigali timezone
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { timeZone: 'Africa/Kigali' });
  };



  return (
    <div className="loan-info-container">
      <h2>
        Loans for Ikimina: <span className="ikimina-name">{ikiName}</span>
      </h2>

      {/* Filter controls */}
      <div className="filter-controls">
        <label htmlFor="roundFilter">Filter by Round:</label>
        <select
          id="roundFilter"
          value={selectedRoundId}
          onChange={(e) => setSelectedRoundId(e.target.value)}
        >
          <option value="current">Current Round (Active/Completed)</option>
          <option value="all">All Rounds</option>
          {rounds.map((r) => (
            <option key={r.round_id} value={r.round_id}>
              Round {r.round_number} ({r.round_year}) - {r.round_status}
            </option>
          ))}
        </select>

        <label htmlFor="statusFilter">Status:</label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="disbursed">Disbursed</option>
          <option value="repaid">Repaid</option>
        </select>

        <label htmlFor="requestFrom">Request Date From:</label>
        <input
          id="requestFrom"
          type="date"
          value={requestFrom}
          onChange={(e) => setRequestFrom(e.target.value)}
        />

        <label htmlFor="requestTo">To:</label>
        <input
          id="requestTo"
          type="date"
          value={requestTo}
          onChange={(e) => setRequestTo(e.target.value)}
        />

        <label htmlFor="paymentFrom">Payment Date From:</label>
        <input
          id="paymentFrom"
          type="date"
          value={paymentFrom}
          onChange={(e) => setPaymentFrom(e.target.value)}
        />

        <label htmlFor="paymentTo">To:</label>
        <input
          id="paymentTo"
          type="date"
          value={paymentTo}
          onChange={(e) => setPaymentTo(e.target.value)}
        />

        <button onClick={fetchLoans}>Search</button>
     
      </div>

      {/* Table or messages */}
      {loading ? (
        <p>Loading loans...</p>
      ) : loans.length === 0 ? (
        <p>No loans found for this Ikimina.</p>
      ) : (
        <div className="table-scroll-wrapper">
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
              {loans.map((loan) => (
                <tr key={loan.loan_id}>
                  <td>{loan.member_names}</td>
                  <td>
                    {loan.round_number} ({loan.round_year})
                  </td>
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
        </div>
      )}
    </div>
  );
};

export default LoanInfoPage;
