// LoanTab.jsx
import React, { useEffect, useState } from 'react';
import LoanPredictionForm from './LoanPredictionForm';

export default function LoanTab() {
  const [userData, setUserData] = useState(null);
  const [missingFields, setMissingFields] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const requiredFields = [
          'savings',
          'joinYear',
          'ikiminaYear',
          'age',
          'hasGuardian',
          'employmentStatus',
          'savingFrequency'
        ];

        const missing = requiredFields.filter(field => parsed[field] === undefined || parsed[field] === null);
        if (missing.length > 0) {
          setMissingFields(missing);
        } else {
          setUserData(parsed);
        }
      } catch (e) {
        setMissingFields(['user (invalid JSON)']);
      }
    } else {
      setMissingFields(['user']);
    }
  }, []);

  if (missingFields.length > 0) {
    return (
      <div className="p-4 text-red-600">
        <h2 className="text-xl font-semibold">⚠️ Missing user fields</h2>
        <p>The following fields are missing from your account info:</p>
        <ul className="list-disc list-inside">
          {missingFields.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
        <p>Please contact your Ikimina manager to update your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Loan Prediction</h1>
      <LoanPredictionForm userData={userData} />
    </div>
  );
}
