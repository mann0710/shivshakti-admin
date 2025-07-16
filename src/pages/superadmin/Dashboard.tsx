import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addSampleMenuItems } from '../../utils/sampleData';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import toast from 'react-hot-toast';

interface SuperAdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalQuotes: number;
  totalOrders: number;
  monthlyRevenue: number;
  menuItems: number;
  activeSubscriptions: number;
  systemHealth: number;
}

const SuperAdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SuperAdminStats>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalQuotes: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    menuItems: 0,
    activeSubscriptions: 0,
    systemHealth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching real data
    const fetchSuperAdminData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setStats({
          totalUsers: 1247,
          totalBusinesses: 89,
          totalQuotes: 2156,
          totalOrders: 1834,
          monthlyRevenue: 845600,
          menuItems: 2847,
          activeSubscriptions: 76,
          systemHealth: 98.5
        });
      } catch (error) {
        console.error('Error fetching superadmin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuperAdminData();
  }, []);

  const handleAddSampleData = async () => {
    const success = await addSampleMenuItems();
    if (success) {
      toast.success('Sample menu items added successfully!');
    } else {
      toast.error('Failed to add sample menu items');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Super Admin Dashboard</h1>
          <p>Welcome back, {currentUser?.displayName}! Here's your system overview.</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Main Statistics */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : stats.totalUsers.toLocaleString()}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-change positive">+24 this week</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : stats.totalBusinesses}</div>
            <div className="stat-label">Active Businesses</div>
            <div className="stat-change positive">+3 this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : formatCurrency(stats.monthlyRevenue)}</div>
            <div className="stat-label">Monthly Revenue</div>
            <div className="stat-change positive">+18% growth</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : `${stats.systemHealth}%`}</div>
            <div className="stat-label">System Health</div>
            <div className="stat-change positive">Excellent</div>
          </div>
        </div>

        {/* Core System Management */}
        <div className="quick-actions">
          <h2>Core System Management</h2>
          <div className="dashboard-grid">
            <Card variant="elevated">
              <CardHeader>
                <h3>🍽️ Menu Management</h3>
              </CardHeader>
              <CardContent>
                <p>Manage global menu items, categories, and pricing across all businesses</p>
                <div className="stat-value" style={{fontSize: 'var(--text-lg)', color: 'var(--color-primary)'}}>
                  {loading ? '...' : stats.menuItems.toLocaleString()} items
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/menu-management')}>
                  Manage Menu
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>👥 User Management</h3>
              </CardHeader>
              <CardContent>
                <p>Add, edit, and manage system users and business administrators</p>
                <div className="stat-value" style={{fontSize: 'var(--text-lg)', color: 'var(--color-accent)'}}>
                  {loading ? '...' : stats.totalUsers.toLocaleString()} users
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/users')}>
                  Manage Users
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>📦 Package Management</h3>
              </CardHeader>
              <CardContent>
                <p>Create and manage subscription packages and pricing tiers</p>
                <div className="stat-value" style={{fontSize: 'var(--text-lg)', color: 'var(--color-warning)'}}>
                  {loading ? '...' : stats.activeSubscriptions} active
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/packages')}>
                  Manage Packages
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>⚙️ System Settings</h3>
              </CardHeader>
              <CardContent>
                <p>Configure system-wide settings, security, and global configurations</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/settings')}>
                  System Settings
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Business Operations */}
        <div className="quick-actions">
          <h2>Business Operations</h2>
          <div className="dashboard-grid">
            <Card variant="elevated">
              <CardHeader>
                <h3>📋 Quote Management</h3>
              </CardHeader>
              <CardContent>
                <p>Monitor and manage quotes across all businesses in the system</p>
                <div className="stat-value" style={{fontSize: 'var(--text-lg)', color: 'var(--color-primary)'}}>
                  {loading ? '...' : stats.totalQuotes.toLocaleString()} total quotes
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/manage-quotes')}>
                  View All Quotes
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>📦 Order Tracking</h3>
              </CardHeader>
              <CardContent>
                <p>Track orders, deliveries, and fulfillment across all businesses</p>
                <div className="stat-value" style={{fontSize: 'var(--text-lg)', color: 'var(--color-accent)'}}>
                  {loading ? '...' : stats.totalOrders.toLocaleString()} total orders
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/orders')}>
                  Track Orders
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>💲 Dynamic Pricing</h3>
              </CardHeader>
              <CardContent>
                <p>Set up pricing rules, strategies, and dynamic pricing algorithms</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/pricing')}>
                  Manage Pricing
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>📊 Analytics & Reports</h3>
              </CardHeader>
              <CardContent>
                <p>View comprehensive business analytics and generate detailed reports</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/reports')}>
                  View Analytics
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* System Tools */}
        <div className="quick-actions">
          <h2>System Tools & Utilities</h2>
          <div className="dashboard-grid">
            <Card variant="outlined">
              <CardHeader>
                <h3>🗃️ Sample Data</h3>
              </CardHeader>
              <CardContent>
                <p>Add sample menu items for testing and demonstration purposes</p>
              </CardContent>
              <CardFooter>
                <Button variant="accent" onClick={handleAddSampleData}>
                  Add Sample Data
                </Button>
              </CardFooter>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <h3>🔧 System Maintenance</h3>
              </CardHeader>
              <CardContent>
                <p>System maintenance tools, database cleanup, and performance optimization</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast.success('Maintenance tools coming soon!')}>
                  Maintenance Tools
                </Button>
              </CardFooter>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <h3>� Data Export</h3>
              </CardHeader>
              <CardContent>
                <p>Export system data, reports, and analytics for external analysis</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast.success('Export functionality coming soon!')}>
                  Export Data
                </Button>
              </CardFooter>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <h3>🛡️ Security Center</h3>
              </CardHeader>
              <CardContent>
                <p>Monitor security events, manage permissions, and system access logs</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast.success('Security center coming soon!')}>
                  Security Center
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
