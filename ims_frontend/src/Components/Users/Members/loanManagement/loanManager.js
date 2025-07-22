import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoanRequestModal from './LoanRequestModal';
import '../../../CSS/LoanDashboard.css';

function LoanDashboard() {
  const [memberId, setMemberId] = useState(null);
  const [loans, setLoans] = useState([]);
  const [allowedLoan, setAllowedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAllowedLoan, setLoadingAllowedLoan] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // On mount, load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.id) {
          setMemberId(user.id);
        } else {
          setError('User ID not found in local storage.');
          setLoading(false);
          setLoadingAllowedLoan(false);
        }
      } catch {
        setError('Failed to parse user info from local storage.');
        setLoading(false);
        setLoadingAllowedLoan(false);
      }
    } else {
      setError('User not logged in.');
      setLoading(false);
      setLoadingAllowedLoan(false);
    }
  }, []);

  // When memberId is set, fetch loans & allowed loan
  useEffect(() => {
    if (!memberId) return;

    async function fetchLoansAndAllowedLoan() {
      try {
        setLoading(true);
        setLoadingAllowedLoan(true);
        setError('');

        const loansRes = await axios.get(`http://localhost:5000/api/loanPredictionRoutes/selectLoans/${memberId}`);
        console.log('[LoanDashboard] Loans fetched:', loansRes.data.loans);
        setLoans(loansRes.data.loans || []);

        const allowedLoanRes = await axios.get(`http://localhost:5000/api/loanPredictionRoutes/predictedAllowedLoan/${memberId}`);
        console.log('[LoanDashboard] Allowed loan fetched:', allowedLoanRes.data.allowedLoan);
        setAllowedLoan(allowedLoanRes.data.allowedLoan ?? 0);
      } catch (err) {
        console.error('[LoanDashboard] Error fetching loans or allowed loan:', err);
        setError('Failed to fetch loans or allowed loan.');
        setAllowedLoan(0);
        setLoans([]);
      } finally {
        setLoading(false);
        setLoadingAllowedLoan(false);
      }
    }

    fetchLoansAndAllowedLoan();
  }, [memberId]);

  if (!memberId) {
    return <p>{error || 'Loading user data...'}</p>;
  }

  return (
    <div className="loan-dashboard-container">
      <h1>My Loans</h1>

      <div className="loan-dashboard-allowed-loan">
        {loadingAllowedLoan ? (
          <p>Loading your eligible loan amount...</p>
        ) : (
          <p>Your predicted eligible loan amount is: <strong>{allowedLoan.toFixed(2)}</strong> RWF</p>
        )}
      </div>

      {loading && <p>Loading loans...</p>}
      {error && <p className="loan-dashboard-error">{error}</p>}
      {!loading && loans.length === 0 && <p>No loans found.</p>}

      {loans.length > 0 && (
        <table className="loan-dashboard-table" border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Requested Amount</th>
              <th>Approved Amount</th>
              <th>Status</th>
              <th>Request Date</th>
              <th>Due Date</th>
              <th>Interest Rate (%)</th>
              <th>Total Repayable</th>
              <th>Interest Paid</th>
              <th>Amount Repaid</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <LoanRow key={loan.loan_id} loan={loan} />
            ))}
          </tbody>
        </table>
      )}

      <button
        className="loan-dashboard-request-btn"
        onClick={() => setModalOpen(true)}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        Request New Loan
      </button>

      {modalOpen && (
        <LoanRequestModal
          memberId={memberId}
          onClose={() => setModalOpen(false)}
          onLoanRequested={() => {
            setModalOpen(false);
            // Refresh loans after new request
            axios.get(`http://localhost:5000/api/loanPredictionRoutes/selectLoans/${memberId}`)
              .then(res => setLoans(res.data.loans || []))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}

function LoanRow({ loan }) {
  const [interestPaid, setInterestPaid] = React.useState(0);
  const [amountRepaid, setAmountRepaid] = React.useState(0);

  React.useEffect(() => {
    async function fetchInterestAndRepayments() {
      try {
        const [interestRes, repaymentRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/loanPredictionRoutes/loanInterest/${loan.loan_id}`),
          axios.get(`http://localhost:5000/api/loanPredictionRoutes/loanRepayments/${loan.loan_id}`)
        ]);

        const interestPaidSum = (interestRes.data.interests || [])
          .filter(i => i.is_paid)
          .reduce((sum, i) => sum + i.interest_amount, 0);
        setInterestPaid(interestPaidSum);

        const amountRepaidSum = (repaymentRes.data.repayments || [])
          .reduce((sum, r) => sum + r.amount_paid, 0);
        setAmountRepaid(amountRepaidSum);
      } catch {
        setInterestPaid(0);
        setAmountRepaid(0);
      }
    }
    fetchInterestAndRepayments();
  }, [loan.loan_id]);

  return (
    <tr>
      <td>{loan.requested_amount.toFixed(2)}</td>
      <td>{loan.approved_amount ? loan.approved_amount.toFixed(2) : '-'}</td>
      <td>{loan.status}</td>
      <td>{new Date(loan.request_date).toLocaleDateString()}</td>
      <td>{loan.due_date ? new Date(loan.due_date).toLocaleDateString() : '-'}</td>
      <td>{loan.interest_rate}%</td>
      <td>{loan.total_repayable ? loan.total_repayable.toFixed(2) : '-'}</td>
      <td>{interestPaid.toFixed(2)}</td>
      <td>{amountRepaid.toFixed(2)}</td>
    </tr>
  );
}

export default LoanDashboard;
