import { Quote } from '../types';
import jsPDF from 'jspdf';

export const generateQuotePDF = async (quote: Quote): Promise<Blob> => {
  const pdf = new jsPDF();
  
  // Helper function to safely convert dates
  const formatDate = (date: any): string => {
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
  
  // Company Header
  pdf.setFontSize(20);
  pdf.setTextColor(44, 62, 80);
  pdf.text('Shivshakti Catering Services', 20, 30);
  
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Premium Catering for Special Occasions', 20, 40);
  
  // Quote Details Section
  pdf.setFontSize(16);
  pdf.setTextColor(44, 62, 80);
  pdf.text('Quote Details', 20, 60);
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  const details = [
    [`Quote Number:`, quote.quoteNumber],
    [`Customer:`, quote.customerName],
    [`Email:`, quote.customerEmail],
    [`Phone:`, quote.customerPhone],
    [`Event Type:`, quote.eventType],
    [`Event Date:`, formatDate(quote.eventDate)],
    [`Event Time:`, quote.eventTime],
    [`Venue:`, quote.venue],
    [`Guest Count:`, quote.guestCount.toString()],
  ];
  
  let yPosition = 75;
  details.forEach(([label, value]) => {
    pdf.text(label, 20, yPosition);
    pdf.text(value, 80, yPosition);
    yPosition += 8;
  });
  
  // Menu Items Section
  yPosition += 10;
  pdf.setFontSize(16);
  pdf.setTextColor(44, 62, 80);
  pdf.text('Menu Items', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  // Table Headers
  pdf.text('Item', 20, yPosition);
  pdf.text('Qty', 100, yPosition);
  pdf.text('Unit Price', 130, yPosition);
  pdf.text('Total', 170, yPosition);
  
  yPosition += 5;
  pdf.line(20, yPosition, 190, yPosition); // Header line
  yPosition += 10;
  
  // Menu Items
  quote.items.forEach(item => {
    pdf.text(item.name, 20, yPosition);
    pdf.text(item.quantity.toString(), 100, yPosition);
    pdf.text(`₹${item.unitPrice.toFixed(2)}`, 130, yPosition);
    pdf.text(`₹${item.total.toFixed(2)}`, 170, yPosition);
    yPosition += 8;
  });
  
  // Totals Section
  yPosition += 10;
  pdf.line(20, yPosition, 190, yPosition); // Separator line
  yPosition += 10;
  
  const totals = [
    ['Subtotal:', `₹${quote.subtotal.toFixed(2)}`],
    ['Tax (18% GST):', `₹${quote.tax.toFixed(2)}`],
    ['Discount:', `₹${quote.discount.toFixed(2)}`],
  ];
  
  totals.forEach(([label, value]) => {
    pdf.text(label, 130, yPosition);
    pdf.text(value, 170, yPosition);
    yPosition += 8;
  });
  
  // Final Total
  yPosition += 5;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Amount:', 130, yPosition);
  pdf.text(`₹${quote.total.toFixed(2)}`, 170, yPosition);
  
  // Special Requests
  if (quote.specialRequests) {
    yPosition += 20;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Special Requests:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    const splitText = pdf.splitTextToSize(quote.specialRequests, 170);
    pdf.text(splitText, 20, yPosition);
  }
  
  // Footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for choosing Shivshakti Catering Services!', 20, pageHeight - 30);
  pdf.text('For any queries, please contact us at info@shivshakticatering.com', 20, pageHeight - 20);
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 10);
  
  return pdf.output('blob');
};

export const downloadQuotePDF = async (quote: Quote): Promise<void> => {
  try {
    const pdfBlob = await generateQuotePDF(quote);
    const url = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quote_${quote.quoteNumber}_${quote.customerName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export const previewQuotePDF = async (quote: Quote): Promise<string> => {
  try {
    const pdfBlob = await generateQuotePDF(quote);
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw new Error('Failed to generate PDF preview');
  }
};
