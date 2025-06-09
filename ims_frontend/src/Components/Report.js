// src/Pages/Report.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './CSS/Report.css';

export default function Report() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/financial_status_data')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Error fetching financial data');
        setLoading(false);
      });
  }, []);

  const years = [...new Set(data.map(item => item.year))];

  if (loading) return <div className="loading-message">Loading data...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (data.length === 0) return <div className="no-data-message">No data available</div>;

  return (
    <div className="report-container">
      <h1 className="report-heading">Financial Report by Year</h1>

      <button onClick={() => navigate('/')} className="back-button">
        ⬅ Back to Dashboard
      </button>

      {years.map(year => {
        const yearData = data.filter(item => item.year === year);
        return (
          <div key={year} className="year-section">
            <h2 className="year-heading">Year: {year}</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip formatter={(value) => `RWF ${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
