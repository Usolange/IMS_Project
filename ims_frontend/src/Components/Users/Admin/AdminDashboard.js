import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Auth } from '../../Auth/Auth';
import { FaFileExcel } from 'react-icons/fa';
import '../../CSS/adminDashboard.css';

export default function Dashboard() {
  const { user } = useContext(Auth);
  const [ikiminas, setIkiminas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getSadId = () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      const user = JSON.parse(storedUser);
      return user?.sad_id || user?.id || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchIkiminas = async () => {
      const sad_id = getSadId();
      if (!sad_id) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/api/ikiminaInfoRoutes/select?sad_id=${sad_id}`);
        setIkiminas(response.data);
      } catch (err) {
        setError('Failed to load Ikimina data.');
      } finally {
        setLoading(false);
      }
    };

    fetchIkiminas();
  }, []);

  const handleExportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(ikiminas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ikiminas');
    XLSX.writeFile(wb, 'ikimina_list.xlsx');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <div className="flex-1 p-6">
        <p className="text-right text-sm text-gray-600 mb-4">
          Welcome, <span className="font-semibold">{user?.name}</span> ({user?.role})
        </p>

        <h2 className="text-xl font-bold mb-2">Your Ikimina Accounts</h2>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {ikiminas.length === 0 ? (
              <p>No Ikimina data available.</p>
            ) : (
              <>
                <div className="mb-3">
                  <button className="btn-primary" onClick={handleExportToExcel}>
                    <FaFileExcel /> Export to Excel
                  </button>
                </div>

                <div className="table-scroll-container">
                  <table className="ikimina-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Ikimina Name</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Location</th>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Events</th>
                        <th>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ikiminas.map((ikimina) => (
                        <tr key={ikimina.iki_id}>
                          <td>{ikimina.iki_id}</td>
                          <td>{ikimina.iki_name}</td>
                          <td>{ikimina.iki_email}</td>
                          <td>{ikimina.iki_username}</td>
                          <td>{`${ikimina.cell || ''}, ${ikimina.village || ''}`}</td>
                          <td>{ikimina.dayOfEvent}</td>
                          <td>{ikimina.timeOfEvent}</td>
                          <td>{ikimina.numberOfEvents}</td>
                          <td>{ikimina.category_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
           
          </>
        )}
      </div>
    </div>
  );
}
