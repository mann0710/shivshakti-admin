import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DateTime } from 'luxon';
import { display } from 'html2canvas/dist/types/css/property-descriptors/display';

interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  venue: string;
  persons: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  notes?: string;
}

// Utility function to format date as dd-MMM-yyyy using luxon
function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = DateTime.fromISO(dateString);
  if (!date.isValid) return dateString;
  return date.toFormat('dd-MMM-yyyy');
}

const Summary: React.FC = () => {
  const navigate = useNavigate();
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem[]>([]);
  const [instructions, setInstructions] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [customTotal, setCustomTotal] = useState<number>(0);

  useEffect(() => {
    const storedCustomerDetails = localStorage.getItem('customerDetails');
    const storedMenu = localStorage.getItem('selectedMenu');

    if (storedCustomerDetails) {
      setCustomerDetails(JSON.parse(storedCustomerDetails));
    }
    if (storedMenu) {
      const menu = JSON.parse(storedMenu);
      setSelectedMenu(menu);
      setLoaded(true);
      setCustomTotal(menu.reduce((total: number, item: MenuItem) => total + (item.price * item.quantity), 0));
    }
  }, []);

  const calculateTotal = () => {
    return selectedMenu.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setCustomTotal(value);
  };

  const handleGeneratePDF = async () => {
    if (!contentRef.current || !loaded || selectedMenu.length === 0) {
      alert("Please wait for the menu to load before generating PDF.");
      return;
    }
  
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // optional: let the DOM update
      const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
  
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
  
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }
  
      pdf.save('catering-order.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };
  

  const handleCreateAnotherMenu = () => {
    navigate('/menu');
  };

  if (!customerDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="summary">
      <h2>Order Summary</h2>
      
      {/* Editable Total Amount - Visible on page */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 'bold' }}>
          <span>Total Amount:</span>
          <input
            type="number"
            value={customTotal}
            onChange={handleTotalChange}
            style={{
              border: '2px solid #007bff',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '16px',
              fontWeight: 'bold',
              width: '150px',
              textAlign: 'right'
            }}
          />
        </label>
      </div>
      
      <div className="summary-content" ref={contentRef}>
        <div className="pdf-header">
          <div className="header-content">
            <img src="/logo.png" alt="Shiv Shakti Catering" className="logo" />
            <div className="slogan">
              <h2>Delicious Food, Perfect Service</h2>
              <p>Making your special moments memorable</p>
            </div>
          </div>
        </div>

        <div className="customer-info">
          <h3>Customer Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{customerDetails.name}</span>
            </div>
            <div className="info-item">
              <label>Phone:</label>
              <span>{customerDetails.phone}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{customerDetails.email || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Date:</label>
              <span>{formatDate(customerDetails.date)}</span>
            </div>
            <div className="info-item">
              <label>Time:</label>
              <span>{customerDetails.time}</span>
            </div>
            <div className="info-item">
              <label>Venue:</label>
              <span>{customerDetails.venue}</span>
            </div>
            <div className="info-item">
              <label>Number of Persons:</label>
              <span>{customerDetails.persons}</span>
            </div>
          </div>
        </div>

        <div className="menu-summary">
          <h3>Selected Menu</h3>
          <table className="menu-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Notes</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedMenu.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.notes || '-'}</td>
                  {/* <td >₹{item.price * item.quantity}</td> */}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="total-label">Total Amount:</td>
                <td className="total-amount">₹{customTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          {/* PDF-only total price section */}
          <div className="pdf-total-only">
            <h4>Total Amount: <span className="total-amount">₹{customTotal.toFixed(2)}</span></h4>
          </div>
        </div>

        {instructions && (
          <div className="instructions">
            <h3>Additional Instructions</h3>
            <p>{instructions}</p>
          </div>
        )}

        <div className="pdf-footer">
          <p>Generated on: {formatDate(DateTime.now().toISO())}</p>
          <div className="signature-space">
            <p>Customer Signature: _________________</p>
          </div>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary" onClick={handleGeneratePDF}>
          Generate PDF
        </button>
        <button className="btn btn-secondary" onClick={handleCreateAnotherMenu}>
          Create Another Menu
        </button>
      </div>
    </div>
  );
};

export default Summary; 
