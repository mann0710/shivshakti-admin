import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Quote, MenuItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { downloadQuotePDF } from '../../services/pdfService';
import toast from 'react-hot-toast';
import '../../components/layout/Dashboard.css';
import './AdminQuotes.css';

const AdminQuotes: React.FC = () => {
  const { logout } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchQuotes();
  }, [filterStatus]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      let quotesQuery;
      
      if (filterStatus === 'all') {
        quotesQuery = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
      } else {
        quotesQuery = query(
          collection(db, 'quotes'),
          where('status', '==', filterStatus),
          orderBy('createdAt', 'desc')
        );
      }
      
      const quotesSnapshot = await getDocs(quotesQuery);
      const quotesList: Quote[] = [];
      quotesSnapshot.forEach((doc) => {
        quotesList.push({ id: doc.id, ...doc.data() } as Quote);
      });
      
      setQuotes(quotesList);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (quoteId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'quotes', quoteId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      toast.success(`Quote status updated to ${newStatus}`);
      fetchQuotes();
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast.error('Failed to update quote status');
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!window.confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'quotes', quoteId));
      toast.success('Quote deleted successfully');
      fetchQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    }
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      await downloadQuotePDF(quote);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'sent': return '#3b82f6';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'completed': return '#059669';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'sent': return 'Sent';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const filteredAndSortedQuotes = quotes
    .filter(quote => {
      if (searchTerm) {
        return (
          quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.eventType.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          // Handle Firestore timestamps properly
          const getDateValue = (date: any) => {
            if (date && typeof date.toDate === 'function') {
              return date.toDate().getTime();
            }
            if (date instanceof Date) {
              return date.getTime();
            }
            if (typeof date === 'string') {
              return new Date(date).getTime();
            }
            return 0;
          };
          comparison = getDateValue(a.createdAt) - getDateValue(b.createdAt);
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
        case 'customer':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Not specified';
    
    // Handle Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    // Handle JavaScript Date
    if (date instanceof Date) {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    return 'Invalid date';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Quote Management</h1>
          <p>Manage all customer quotes and proposals</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Filters and Search */}
        <Card variant="elevated" className="quotes-controls-card">
          <CardContent>
            <div className="quotes-controls">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search quotes by customer, quote number, or event type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-section">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'customer')}
                  className="filter-select"
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="customer">Sort by Customer</option>
                </select>
                
                <Button
                  variant={sortOrder === 'asc' ? 'primary' : 'outline'}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  size="sm"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{quotes.length}</div>
            <div className="stat-label">Total Quotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{quotes.filter(q => q.status === 'approved').length}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{quotes.filter(q => q.status === 'sent').length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {formatCurrency(quotes.filter(q => q.status === 'approved').reduce((sum, q) => sum + q.total, 0))}
            </div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
        {/* Quotes Table */}
        <Card variant="elevated">
          <CardHeader>
            <h2>All Quotes ({filteredAndSortedQuotes.length})</h2>
          </CardHeader>
          <CardContent>
            {filteredAndSortedQuotes.length === 0 ? (
              <div className="empty-state">
                <h3>No quotes found</h3>
                <p>No quotes match your current filters</p>
              </div>
            ) : (
              <div className="quotes-table-container">
                <table className="quotes-table">
                  <thead>
                    <tr>
                      <th>Quote #</th>
                      <th>Customer</th>
                      <th>Event Type</th>
                      <th>Event Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedQuotes.map((quote) => (
                      <tr key={quote.id}>
                        <td className="quote-number">{quote.quoteNumber}</td>
                        <td className="customer-name">{quote.customerName}</td>
                        <td>{quote.eventType}</td>
                        <td>{formatDate(quote.eventDate)}</td>
                        <td className="amount">{formatCurrency(quote.total)}</td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(quote.status) }}
                          >
                            {getStatusLabel(quote.status)}
                          </span>
                        </td>
                        <td>{formatDate(quote.createdAt)}</td>
                        <td className="actions">
                          <div className="action-buttons">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedQuote(quote);
                                setShowDetailsModal(true);
                              }}
                            >
                              View
                            </Button>
                            
                            {quote.status === 'draft' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleStatusUpdate(quote.id, 'sent')}
                              >
                                Send
                              </Button>
                            )}
                            
                            {quote.status === 'sent' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(quote.id, 'approved')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(quote.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(quote)}
                            >
                              PDF
                            </Button>
                            
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteQuote(quote.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Details Modal */}
        {showDetailsModal && selectedQuote && (
          <div className="modal-overlay">
            <Card variant="elevated" className="modal-content quote-details-modal">
              <CardHeader>
                <h2>Quote Details - {selectedQuote.quoteNumber}</h2>
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>×</Button>
              </CardHeader>

              <CardContent>
                <div className="quote-summary">
                  <div className="summary-section">
                    <h3>Customer Information</h3>
                    <div className="info-grid">
                      <div><strong>Name:</strong> {selectedQuote.customerName}</div>
                      <div><strong>Email:</strong> {selectedQuote.customerEmail}</div>
                      <div><strong>Phone:</strong> {selectedQuote.customerPhone}</div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3>Event Details</h3>
                    <div className="info-grid">
                      <div><strong>Type:</strong> {selectedQuote.eventType}</div>
                      <div><strong>Date:</strong> {formatDate(selectedQuote.eventDate)}</div>
                      <div><strong>Time:</strong> {selectedQuote.eventTime}</div>
                      <div><strong>Venue:</strong> {selectedQuote.venue}</div>
                      <div><strong>Guests:</strong> {selectedQuote.guestCount}</div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3>Quote Items</h3>
                    <div className="items-list">
                      {selectedQuote.items.map((item, index) => (
                        <div key={index} className="item-row">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">{item.quantity} {item.unit}</span>
                          <span className="item-price">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3>Pricing Summary</h3>
                    <div className="pricing-summary">
                      <div className="price-row">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedQuote.subtotal)}</span>
                      </div>
                      <div className="price-row">
                        <span>Tax:</span>
                        <span>{formatCurrency(selectedQuote.tax)}</span>
                      </div>
                      <div className="price-row">
                        <span>Discount:</span>
                        <span>-{formatCurrency(selectedQuote.discount)}</span>
                      </div>
                      <div className="price-row total">
                        <span><strong>Total:</strong></span>
                        <span><strong>{formatCurrency(selectedQuote.total)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {selectedQuote.specialRequests && (
                    <div className="summary-section">
                      <h3>Special Requests</h3>
                      <p>{selectedQuote.specialRequests}</p>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  variant="primary" 
                  onClick={() => handleDownloadPDF(selectedQuote)}
                >
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuotes;
