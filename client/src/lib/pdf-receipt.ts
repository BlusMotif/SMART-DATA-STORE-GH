import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  id: string;
  reference: string;
  type: string;
  productName: string;
  network?: string | null;
  amount: string;
  customerPhone: string;
  customerEmail?: string | null;
  phoneNumbers?: string[] | null;
  isBulkOrder: boolean;
  paymentMethod: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  deliveredPin?: string | null;
  deliveredSerial?: string | null;
}

export function generateReceipt(transaction: Transaction) {
  try {
    const doc = new jsPDF();
  
  // Company Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Smart Data Store', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Receipt', 105, 28, { align: 'center' });
  
  // Draw line
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);
  
  // Receipt Details Section
  const startY = 40;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 20, startY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Format date properly
  let formattedDate = 'N/A';
  try {
    // Try multiple date fields and formats
    const dateValue = transaction.createdAt || transaction.completedAt;
    if (dateValue) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } else {
      // If no date available, use current date as fallback
      const now = new Date();
      formattedDate = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch (e) {
    console.error('Date parsing error:', e);
    // Use current date as fallback on error
    const now = new Date();
    formattedDate = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  const details = [
    ['Reference:', transaction.reference],
    ['Date:', formattedDate],
    ['Status:', transaction.status.toUpperCase()],
    ['Payment Method:', transaction.paymentMethod === 'wallet' ? 'Wallet' : 'MoMo (Paystack)'],
  ];
  
  let yPos = startY + 8;
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 60, yPos);
    yPos += 7;
  });
  
  // Product Information
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Product Information', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const productInfo = [
    ['Product:', transaction.productName],
  ];
  
  if (transaction.network) {
    productInfo.push(['Network:', transaction.network.toUpperCase()]);
  }
  
  // Better bulk order detection
  const isBulk = transaction.isBulkOrder || 
                 (transaction.productName && transaction.productName.toLowerCase().includes('bulk')) ||
                 (transaction.phoneNumbers && transaction.phoneNumbers.length > 1);
  
  if (isBulk) {
    productInfo.push(['Type:', 'Bulk Order']);
    if (transaction.phoneNumbers && transaction.phoneNumbers.length > 0) {
      const count = Array.isArray(transaction.phoneNumbers[0]) ? transaction.phoneNumbers.length : transaction.phoneNumbers.length;
      productInfo.push(['Recipients:', `${count} phone numbers`]);
    } else {
      // Handle old bulk orders without phoneNumbers array
      const itemCount = transaction.productName.match(/(\d+)\s*items?/i);
      if (itemCount) {
        productInfo.push(['Recipients:', `${itemCount[1]} phone numbers (See below)`]);
      } else {
        productInfo.push(['Recipients:', 'Multiple phone numbers (See below)']);
      }
    }
  } else if (transaction.customerPhone) {
    // Only show single recipient for non-bulk orders with phone
    productInfo.push(['Recipient:', transaction.customerPhone]);
  }
  
  productInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 60, yPos);
    yPos += 7;
  });
  
  // Recipient Phone Numbers (for bulk orders)
  // Reuse the isBulk variable from above
  if (isBulk) {
    if (transaction.phoneNumbers && transaction.phoneNumbers.length > 0) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Recipient Numbers', 20, yPos);
      yPos += 5;
      
      // Check if phoneNumbers contains objects with GB info or just strings
      const firstItem = transaction.phoneNumbers[0];
      const hasGBInfo = firstItem && typeof firstItem === 'object' && ('dataAmount' in firstItem || 'bundleName' in firstItem);
      
      console.log('PDF Receipt Debug:', {
        firstItem,
        hasGBInfo,
        itemType: typeof firstItem,
        keys: firstItem && typeof firstItem === 'object' ? Object.keys(firstItem) : 'N/A'
      });
      
      // Use autoTable with proper typing
      (autoTable as any)(doc, {
        startY: yPos,
        head: hasGBInfo ? [['#', 'Phone Number', 'Data Amount']] : [['#', 'Phone Number']],
        body: transaction.phoneNumbers.map((item: any, index: number) => {
          if (hasGBInfo) {
            return [`${index + 1}`, item.phone || item, item.dataAmount || item.bundleName || ''];
          } else {
            return [`${index + 1}`, typeof item === 'string' ? item : (item.phone || item)];
          }
        }),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9 },
      });
      
      // Get the final Y position after the table
      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      // For old bulk orders without stored phone numbers
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const itemCount = transaction.productName.match(/(\d+)\s*items?/i);
      const countText = itemCount ? itemCount[1] : 'Multiple';
      doc.text(`Note: This bulk order contains ${countText} recipients.`, 20, yPos);
      doc.text('Phone numbers are not available for this transaction.', 20, yPos + 5);
      doc.text('Please contact support if you need the recipient list.', 20, yPos + 10);
      doc.setTextColor(0, 0, 0);
      yPos += 20;
    }
  }
  
  // Result Checker Details (if applicable)
  if (transaction.type === 'result_checker' && transaction.deliveredPin) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Result Checker Details', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Serial Number:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.deliveredSerial || 'N/A', 60, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'bold');
    doc.text('PIN:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.deliveredPin, 60, yPos);
    yPos += 10;
  } else {
    yPos += 5;
  }
  
  // Amount Section
  yPos += 5;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 120, yPos);
  doc.setFontSize(14);
  doc.text(`GH₵ ${parseFloat(transaction.amount).toFixed(2)}`, 165, yPos);
  
  // Footer
  yPos = 270;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
  doc.text('For support, contact us at support@smartdatastore.com', 105, yPos + 5, { align: 'center' });
  
  // Generate filename
  const filename = `receipt_${transaction.reference}_${Date.now()}.pdf`;
  
  // Save the PDF
  doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
