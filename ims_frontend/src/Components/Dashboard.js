// src/Components/Dashboard.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './css/Dashboard.css';

export default function Dashboard() {
  const [moneyData, setMoneyData] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/financial')
      .then((response) => setMoneyData(response.data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  const capital = moneyData.find(item => item.name === 'Capital')?.amount || 0;
  const loans = moneyData.find(item => item.name === 'Loans')?.amount || 0;
  const cash = moneyData.find(item => item.name === 'Cash')?.amount || 0;

  return (
    <>
      <header className="main-header">
        <h1 className="main-title">Dashboard</h1>
        <p className="main-subtitle">Welcome to your Ikimina Management System.</p>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <h2 className="stat-title">Total Members</h2>
          <p className="stat-value">215</p>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Total Capital</h2>
          <p className="stat-value">RWF {capital.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Loans Issued</h2>
          <p className="stat-value">RWF {loans.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Cash on Hand</h2>
          <p className="stat-value">RWF {cash.toLocaleString()}</p>
        </div>
      </section>

      <section className="chart-container">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Financial Overview</h2>
        <div className="custom-chart-wrapper">
          <ResponsiveContainer width="80%" height={200}>
            <BarChart data={moneyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${v / 1000000}M`} />
              <Tooltip formatter={(value) => `RWF ${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill="#4f66e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
