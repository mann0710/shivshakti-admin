import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Quote } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { downloadQuotePDF } from '../../services/pdfService';
import toast from 'react-hot-toast';
import './CustomerQuotes.css';

const CustomerQuotes: React.FC = () => {
  const { currentUser } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchQuotes();
    }
  }, [currentUser]);

  const fetchQuotes = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'quotes'),
        where('customerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const quotesList: Quote[] = [];
      
      querySnapshot.forEach((doc) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'sent': return '#3b82f6';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'completed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'sent': return 'Sent';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      await downloadQuotePDF(quote);
      toast.success('Quote PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="customer-quotes">
      <div className="quotes-header">
        <h1>My Quotes</h1>
        <p>View and download your catering quotes</p>
      </div>

      {quotes.length === 0 ? (
        <div className="empty-state">
          <h3>No quotes available</h3>
          <p>You don't have any quotes yet. Contact our team to get started!</p>
          <Button variant="primary">Contact Us</Button>
        </div>
      ) : (
        <div className="quotes-content">
          <div className="quotes-list">
            <h2>Your Quotes ({quotes.length})</h2>
            <div className="quotes-grid">
              {quotes.map((quote) => (
                <div 
                  key={quote.id} 
                  className={`quote-card ${selectedQuote?.id === quote.id ? 'selected' : ''}`}
                  onClick={() => setSelectedQuote(quote)}
                >
                  <div className="quote-header">
                    <div className="quote-number">#{quote.quoteNumber}</div>
                    <div 
                      className="quote-status" 
                      style={{ backgroundColor: getStatusColor(quote.status) }}
                    >
                      {getStatusText(quote.status)}
                    </div>
                  </div>
                  
                  <div className="quote-details">
                    <div className="quote-event">
                      <strong>{quote.eventType}</strong>
                      <span>{formatDate(quote.eventDate)}</span>
                    </div>
                    <div className="quote-venue">{quote.venue}</div>
                    <div className="quote-guests">{quote.guestCount} guests</div>
                  </div>
                  
                  <div className="quote-total">
                    <span className="total-amount">{formatCurrency(quote.total)}</span>
                    <span className="created-date">
                      Created: {formatDate(quote.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedQuote && (
            <div className="quote-details-panel">
              <div className="quote-details-header">
                <h2>Quote Details</h2>
                <div className="quote-actions">
                  <Button 
                    variant="primary" 
                    onClick={() => handleDownloadPDF(selectedQuote)}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>

              <div className="quote-info">
                <div className="info-section">
                  <h3>Event Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Event Type:</label>
                      <span>{selectedQuote.eventType}</span>
                    </div>
                    <div className="info-item">
                      <label>Date:</label>
                      <span>{formatDate(selectedQuote.eventDate)}</span>
                    </div>
                    <div className="info-item">
                      <label>Time:</label>
                      <span>{selectedQuote.eventTime || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Venue:</label>
                      <span>{selectedQuote.venue}</span>
                    </div>
                    <div className="info-item">
                      <label>Guests:</label>
                      <span>{selectedQuote.guestCount}</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>Menu Items</h3>
                  <div className="menu-items">
                    {selectedQuote.items.map((item, index) => (
                      <div key={index} className="menu-item">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-category">{item.category}</span>
                        </div>
                        <div className="item-details">
                          <span className="item-quantity">{item.quantity} {item.unit}</span>
                          <span className="item-price">{formatCurrency(item.unitPrice)}</span>
                          <span className="item-total">{formatCurrency(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="info-section">
                  <h3>Pricing Summary</h3>
                  <div className="pricing-summary">
                    <div className="pricing-row">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedQuote.subtotal)}</span>
                    </div>
                    <div className="pricing-row">
                      <span>Tax (18% GST):</span>
                      <span>{formatCurrency(selectedQuote.tax)}</span>
                    </div>
                    {selectedQuote.discount > 0 && (
                      <div className="pricing-row discount">
                        <span>Discount:</span>
                        <span>-{formatCurrency(selectedQuote.discount)}</span>
                      </div>
                    )}
                    <div className="pricing-row total">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedQuote.total)}</span>
                    </div>
                  </div>
                </div>

                {selectedQuote.specialRequests && (
                  <div className="info-section">
                    <h3>Special Requests</h3>
                    <p className="special-requests">{selectedQuote.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerQuotes;
