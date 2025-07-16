import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { 
  fetchDashboardStats, 
  fetchRecentActivities, 
  fetchRecentQuotes,
  fetchTopCustomers,
  formatCurrency, 
  formatTimeAgo, 
  getActivityIcon,
  getStatusColor,
  type DashboardStats,
  type RecentActivity,
  type QuoteData,
  type CustomerData
} from '../../services/dashboardService';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotes: 0,
    activeQuotes: 0,
    completedQuotes: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    avgOrderValue: 0,
    conversionRate: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<QuoteData[]>([]);
  const [topCustomers, setTopCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [statsData, activitiesData, quotesData, customersData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentActivities(),
          fetchRecentQuotes(),
          fetchTopCustomers()
        ]);
        
        setStats(statsData);
        setRecentActivities(activitiesData);
        setRecentQuotes(quotesData);
        setTopCustomers(customersData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Business Admin Dashboard</h1>
          <p>Welcome back, {currentUser?.displayName}</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Statistics Cards */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : stats.totalQuotes}</div>
            <div className="stat-label">Total Quotes</div>
            <div className="stat-change positive">+{loading ? '...' : Math.round((stats.totalQuotes / 30) * 100) / 100}% this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : stats.activeQuotes}</div>
            <div className="stat-label">Active Quotes</div>
            <div className="stat-change positive">+{loading ? '...' : Math.floor(stats.activeQuotes / 7)} new this week</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : stats.totalCustomers}</div>
            <div className="stat-label">Total Customers</div>
            <div className="stat-change positive">+{loading ? '...' : Math.round((stats.totalCustomers / 50) * 100)}% growth</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : formatCurrency(stats.monthlyRevenue)}</div>
            <div className="stat-label">Monthly Revenue</div>
            <div className="stat-change positive">+{loading ? '...' : Math.round((stats.weeklyRevenue / stats.monthlyRevenue) * 100)}% vs last month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : formatCurrency(stats.avgOrderValue)}</div>
            <div className="stat-label">Avg Order Value</div>
            <div className="stat-change positive">+8% increase</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : `${stats.conversionRate}%`}</div>
            <div className="stat-label">Conversion Rate</div>
            <div className="stat-change positive">Excellent</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="dashboard-grid">
            <Card variant="elevated">
              <CardHeader>
                <h3>🎯 Create New Quote</h3>
              </CardHeader>
              <CardContent>
                <p>Create detailed catering quotes for customers with menu selection and pricing</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/create-quote')}>
                  Create Quote
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>📋 Manage Quotes</h3>
              </CardHeader>
              <CardContent>
                <p>View, edit, approve, and track all customer quotes and their status</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/manage-quotes')}>
                  View All Quotes
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>👥 Customer Management</h3>
              </CardHeader>
              <CardContent>
                <p>Manage customer accounts, view history, and handle relationships</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/customers')}>
                  Manage Customers
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>🍽️ Menu Management</h3>
              </CardHeader>
              <CardContent>
                <p>Browse and manage menu items, categories, and pricing for quotes</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/menu-management')}>
                  Manage Menu
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>📦 Order Tracking</h3>
              </CardHeader>
              <CardContent>
                <p>Track confirmed orders, delivery status, and order fulfillment</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/orders')}>
                  Track Orders
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <h3>📊 Reports & Analytics</h3>
              </CardHeader>
              <CardContent>
                <p>View business performance, sales analytics, and detailed reports</p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => navigate('/reports')}>
                  View Reports
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <Card>
            <CardContent className="activity-card-content">
              <div className="activity-list">
                {loading ? (
                  <div className="activity-item">
                    <div className="activity-icon">⏳</div>
                    <div className="activity-content">
                      <div className="activity-title">Loading activities...</div>
                    </div>
                  </div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">{activity.title}</div>
                        <div className="activity-description">{activity.description}</div>
                        {activity.amount && (
                          <div className="activity-amount" style={{color: 'var(--color-success)', fontWeight: '600', fontSize: 'var(--text-sm)'}}>
                            {formatCurrency(activity.amount)}
                          </div>
                        )}
                      </div>
                      <div className="activity-time">{formatTimeAgo(activity.timestamp)}</div>
                    </div>
                  ))
                ) : (
                  <div className="activity-item">
                    <div className="activity-icon">📭</div>
                    <div className="activity-content">
                      <div className="activity-title">No recent activities</div>
                      <div className="activity-description">Activities will appear here as they happen</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Quotes */}
        <div className="recent-activity">
          <h2>Recent Quotes</h2>
          <Card>
            <CardContent className="activity-card-content">
              <div className="activity-list">
                {loading ? (
                  <div className="activity-item">
                    <div className="activity-icon">⏳</div>
                    <div className="activity-content">
                      <div className="activity-title">Loading quotes...</div>
                    </div>
                  </div>
                ) : recentQuotes.length > 0 ? (
                  recentQuotes.map((quote) => (
                    <div key={quote.id} className="activity-item">
                      <div className="activity-icon">📋</div>
                      <div className="activity-content">
                        <div className="activity-title">{quote.id} - {quote.customerName}</div>
                        <div className="activity-description">{quote.eventType}</div>
                        <div className="activity-amount" style={{color: 'var(--color-primary)', fontWeight: '600', fontSize: 'var(--text-sm)'}}>
                          {formatCurrency(quote.totalAmount)}
                        </div>
                      </div>
                      <div className="activity-time">
                        <span style={{
                          background: getStatusColor(quote.status),
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--text-xs)',
                          textTransform: 'capitalize'
                        }}>
                          {quote.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="activity-item">
                    <div className="activity-icon">📋</div>
                    <div className="activity-content">
                      <div className="activity-title">No recent quotes</div>
                      <div className="activity-description">Quotes will appear here as they are created</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Customers */}
        <div className="recent-activity">
          <h2>Top Customers</h2>
          <Card>
            <CardContent className="activity-card-content">
              <div className="activity-list">
                {loading ? (
                  <div className="activity-item">
                    <div className="activity-icon">⏳</div>
                    <div className="activity-content">
                      <div className="activity-title">Loading customers...</div>
                    </div>
                  </div>
                ) : topCustomers.length > 0 ? (
                  topCustomers.map((customer) => (
                    <div key={customer.id} className="activity-item">
                      <div className="activity-icon">�</div>
                      <div className="activity-content">
                        <div className="activity-title">{customer.name}</div>
                        <div className="activity-description">{customer.totalOrders} orders • Last: {formatTimeAgo(customer.lastOrderDate)}</div>
                        <div className="activity-amount" style={{color: 'var(--color-accent)', fontWeight: '600', fontSize: 'var(--text-sm)'}}>
                          Total: {formatCurrency(customer.totalSpent)}
                        </div>
                      </div>
                      <div className="activity-time">
                        <span style={{
                          background: getStatusColor(customer.status),
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--text-xs)',
                          textTransform: 'capitalize'
                        }}>
                          {customer.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="activity-item">
                    <div className="activity-icon">👥</div>
                    <div className="activity-content">
                      <div className="activity-title">No customers yet</div>
                      <div className="activity-description">Customer data will appear here as orders are placed</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
