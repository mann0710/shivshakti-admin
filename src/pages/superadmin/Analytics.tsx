import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Quote, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import '../../components/layout/Dashboard.css';
import './Analytics.css';

interface AnalyticsData {
  totalQuotes: number;
  approvedQuotes: number;
  totalRevenue: number;
  averageOrderValue: number;
  monthlyQuotes: { month: string; count: number; revenue: number }[];
  topCustomers: { name: string; totalSpent: number; quotesCount: number }[];
  popularItems: { name: string; quantity: number; revenue: number }[];
  conversionRate: number;
}

const Analytics: React.FC = () => {
  const { logout } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30days');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'last7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'last30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'last90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'lastyear':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const startDate = getDateFilter();
      
      // Fetch quotes
      const quotesQuery = query(
        collection(db, 'quotes'),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );
      
      const quotesSnapshot = await getDocs(quotesQuery);
      const quotes: Quote[] = [];
      quotesSnapshot.forEach((doc) => {
        quotes.push({ id: doc.id, ...doc.data() } as Quote);
      });

      // Calculate analytics
      const totalQuotes = quotes.length;
      const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
      const totalRevenue = quotes
        .filter(q => q.status === 'approved')
        .reduce((sum, q) => sum + q.total, 0);
      
      const averageOrderValue = approvedQuotes > 0 ? totalRevenue / approvedQuotes : 0;
      const conversionRate = totalQuotes > 0 ? (approvedQuotes / totalQuotes) * 100 : 0;

      // Monthly breakdown
      const monthlyData = new Map<string, { count: number; revenue: number }>();
      quotes.forEach(quote => {
        const month = new Date(quote.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { count: 0, revenue: 0 });
        }
        const data = monthlyData.get(month)!;
        data.count += 1;
        if (quote.status === 'approved') {
          data.revenue += quote.total;
        }
      });

      const monthlyQuotes = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        count: data.count,
        revenue: data.revenue
      }));

      // Top customers
      const customerData = new Map<string, { totalSpent: number; quotesCount: number }>();
      quotes.forEach(quote => {
        if (!customerData.has(quote.customerName)) {
          customerData.set(quote.customerName, { totalSpent: 0, quotesCount: 0 });
        }
        const data = customerData.get(quote.customerName)!;
        data.quotesCount += 1;
        if (quote.status === 'approved') {
          data.totalSpent += quote.total;
        }
      });

      const topCustomers = Array.from(customerData.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      // Popular items
      const itemData = new Map<string, { quantity: number; revenue: number }>();
      quotes.forEach(quote => {
        if (quote.status === 'approved') {
          quote.items.forEach(item => {
            if (!itemData.has(item.name)) {
              itemData.set(item.name, { quantity: 0, revenue: 0 });
            }
            const data = itemData.get(item.name)!;
            data.quantity += item.quantity;
            data.revenue += item.total;
          });
        }
      });

      const popularItems = Array.from(itemData.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setAnalytics({
        totalQuotes,
        approvedQuotes,
        totalRevenue,
        averageOrderValue,
        monthlyQuotes,
        topCustomers,
        popularItems,
        conversionRate
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!analytics) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Analytics Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div className="dashboard-content">
          <div className="error-state">
            <p>Failed to load analytics data</p>
            <Button onClick={fetchAnalytics}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Business insights and performance metrics</p>
        </div>
        <div className="dashboard-actions">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="lastyear">Last Year</option>
          </select>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon revenue">₹</div>
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <div className="metric-value">{formatCurrency(analytics.totalRevenue)}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon quotes">📋</div>
            <div className="metric-content">
              <h3>Total Quotes</h3>
              <div className="metric-value">{analytics.totalQuotes}</div>
              <div className="metric-subtitle">
                {analytics.approvedQuotes} approved
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon conversion">📈</div>
            <div className="metric-content">
              <h3>Conversion Rate</h3>
              <div className="metric-value">{analytics.conversionRate.toFixed(1)}%</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon average">💰</div>
            <div className="metric-content">
              <h3>Avg Order Value</h3>
              <div className="metric-value">{formatCurrency(analytics.averageOrderValue)}</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <h3>Monthly Performance</h3>
            <div className="chart-placeholder">
              <div className="monthly-data">
                {analytics.monthlyQuotes.map((month, index) => (
                  <div key={index} className="month-item">
                    <div className="month-label">{month.month}</div>
                    <div className="month-stats">
                      <div className="stat">
                        <span className="stat-label">Quotes:</span>
                        <span className="stat-value">{month.count}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Revenue:</span>
                        <span className="stat-value">{formatCurrency(month.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="tables-section">
          <div className="table-container">
            <h3>Top Customers</h3>
            <div className="table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Total Spent</th>
                    <th>Quotes</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topCustomers.map((customer, index) => (
                    <tr key={index}>
                      <td>{customer.name}</td>
                      <td>{formatCurrency(customer.totalSpent)}</td>
                      <td>{customer.quotesCount}</td>
                    </tr>
                  ))}
                  {analytics.topCustomers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="no-data">No customer data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-container">
            <h3>Popular Menu Items</h3>
            <div className="table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.popularItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                  {analytics.popularItems.length === 0 && (
                    <tr>
                      <td colSpan={3} className="no-data">No item data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
