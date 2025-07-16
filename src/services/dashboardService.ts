import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface DashboardStats {
  totalQuotes: number;
  activeQuotes: number;
  completedQuotes: number;
  totalCustomers: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  avgOrderValue: number;
  conversionRate: number;
}

export interface RecentActivity {
  id: string;
  type: 'quote_created' | 'quote_approved' | 'quote_completed' | 'customer_added' | 'order_delivered' | 'payment_received';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  amount?: number;
}

export interface QuoteData {
  id: string;
  customerName: string;
  eventType: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  totalAmount: number;
  createdAt: Date;
  eventDate?: Date;
}

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date;
  status: 'active' | 'inactive';
}

// Simulate real data fetching with Firebase structure
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Simulate data that would come from Firestore collections
    // In a real app, this would query actual collections like 'quotes', 'customers', etc.
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Generate realistic data based on current date
    const baseQuotes = 45 + Math.floor(Math.random() * 30);
    const baseCustomers = 23 + Math.floor(Math.random() * 15);
    const baseRevenue = 25000 + Math.floor(Math.random() * 50000);
    
    return {
      totalQuotes: baseQuotes,
      activeQuotes: Math.floor(baseQuotes * 0.3),
      completedQuotes: Math.floor(baseQuotes * 0.6),
      totalCustomers: baseCustomers,
      monthlyRevenue: baseRevenue,
      weeklyRevenue: Math.floor(baseRevenue * 0.25),
      avgOrderValue: Math.floor(baseRevenue / baseQuotes),
      conversionRate: 68 + Math.floor(Math.random() * 20)
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return fallback data
    return {
      totalQuotes: 45,
      activeQuotes: 12,
      completedQuotes: 28,
      totalCustomers: 23,
      monthlyRevenue: 45200,
      weeklyRevenue: 11300,
      avgOrderValue: 1850,
      conversionRate: 72
    };
  }
};

export const fetchRecentActivities = async (): Promise<RecentActivity[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'quote_created',
        title: 'New Quote Created',
        description: 'Wedding reception quote for the Sharma family - 150 guests',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        user: 'Admin',
        amount: 45000
      },
      {
        id: '2',
        type: 'quote_approved',
        title: 'Quote Approved',
        description: 'Corporate event catering approved - Tech Solutions Ltd',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        user: 'Customer',
        amount: 28500
      },
      {
        id: '3',
        type: 'payment_received',
        title: 'Payment Received',
        description: 'Full payment received for birthday party catering',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        amount: 12500
      },
      {
        id: '4',
        type: 'customer_added',
        title: 'New Customer Registered',
        description: 'Priya Patel joined as a new customer',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        user: 'Priya Patel'
      },
      {
        id: '5',
        type: 'order_delivered',
        title: 'Order Delivered',
        description: 'Anniversary dinner successfully delivered to Kumar family',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        amount: 8500
      },
      {
        id: '6',
        type: 'quote_completed',
        title: 'Event Completed',
        description: 'Housewarming party catering completed successfully',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        amount: 15000
      }
    ];
    
    return activities;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

export const fetchRecentQuotes = async (): Promise<QuoteData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 'Q001',
        customerName: 'Rajesh Sharma',
        eventType: 'Wedding Reception',
        status: 'pending',
        totalAmount: 45000,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'Q002',
        customerName: 'Tech Solutions Ltd',
        eventType: 'Corporate Event',
        status: 'approved',
        totalAmount: 28500,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'Q003',
        customerName: 'Anita Gupta',
        eventType: 'Birthday Party',
        status: 'completed',
        totalAmount: 12500,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        eventDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
  } catch (error) {
    console.error('Error fetching recent quotes:', error);
    return [];
  }
};

export const fetchTopCustomers = async (): Promise<CustomerData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return [
      {
        id: 'C001',
        name: 'Rajesh Sharma',
        email: 'rajesh.sharma@email.com',
        phone: '+91 98765 43210',
        totalOrders: 5,
        totalSpent: 125000,
        lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        id: 'C002',
        name: 'Tech Solutions Ltd',
        email: 'events@techsolutions.com',
        phone: '+91 99887 65432',
        totalOrders: 3,
        totalSpent: 85000,
        lastOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        id: 'C003',
        name: 'Priya Patel',
        email: 'priya.patel@email.com',
        phone: '+91 97654 32108',
        totalOrders: 2,
        totalSpent: 35000,
        lastOrderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'active'
      }
    ];
  } catch (error) {
    console.error('Error fetching top customers:', error);
    return [];
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return '1 week ago';
  return `${diffInWeeks} weeks ago`;
};

export const getActivityIcon = (type: RecentActivity['type']): string => {
  const icons = {
    quote_created: '📝',
    quote_approved: '✅',
    quote_completed: '🎉',
    customer_added: '👤',
    order_delivered: '🚚',
    payment_received: '💰'
  };
  return icons[type] || '📋';
};

export const getStatusColor = (status: string): string => {
  const colors = {
    pending: 'var(--color-warning)',
    approved: 'var(--color-success)',
    completed: 'var(--color-primary)',
    rejected: 'var(--color-error)',
    active: 'var(--color-success)',
    inactive: 'var(--color-gray-400)'
  };
  return colors[status as keyof typeof colors] || 'var(--color-text-muted)';
};
