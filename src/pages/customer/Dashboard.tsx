import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import '../../components/layout/Dashboard.css';

const CustomerDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Customer Dashboard</h1>
          <p>Welcome back, {currentUser?.displayName}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>My Quotes</h3>
            <p>View quotes prepared by our team for your events</p>
            <div className="card-actions">
              <Button variant="primary" onClick={() => navigate('/my-quotes')}>
                View My Quotes
              </Button>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Download PDFs</h3>
            <p>Download finalized quotes as PDF documents</p>
            <div className="card-actions">
              <Button variant="primary" onClick={() => navigate('/my-quotes')}>
                Download Quotes
              </Button>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Event History</h3>
            <p>Track your past and current catering events</p>
            <div className="card-actions">
              <Button variant="primary" onClick={() => navigate('/event-history')}>
                View History
              </Button>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Contact Support</h3>
            <p>Get in touch with our catering team for assistance</p>
            <div className="card-actions">
              <Button variant="primary">Contact Us</Button>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Account Settings</h3>
            <p>Update your profile and preferences</p>
            <div className="card-actions">
              <Button variant="primary">Settings</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
