import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface ResultCheckerPDFData {
  type: string;
  year: number;
  pin?: string;
  serialNumber?: string;
  pins?: Array<{ pin: string; serialNumber: string }>;
  customerName?: string;
  customerPhone?: string;
  purchaseDate: Date;
  transactionReference: string;
}

export function generateResultCheckerPDF(data: ResultCheckerPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const isMultiple = data.pins && data.pins.length > 1;
      const pins = data.pins || (data.pin && data.serialNumber ? [{ pin: data.pin, serialNumber: data.serialNumber }] : []);
      
      // Business card size: 3.5 x 2 inches (252 x 144 points)
      const doc = new PDFDocument({
        size: [252, 144],
        margin: 0,
        info: {
          Title: `${data.type.toUpperCase()} Result Checker ${data.year}`,
          Author: 'resellershubprogh.com',
          Subject: 'Result Checker Credentials',
        }
      });

      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Render each PIN as a separate card
      pins.forEach((pinData, index) => {
        if (index > 0) {
          doc.addPage();
        }
        
        const cardWidth = 252;
        const cardHeight = 144;
        const margin = 10;
        
        // Simple border
        doc.roundedRect(2, 2, cardWidth - 4, cardHeight - 4, 3).stroke('#000000');
        
        // Header
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
           .text('RESELLERS HUB PRO', margin, 8, { align: 'center', width: cardWidth - (margin * 2) });
        
        doc.fontSize(7).font('Helvetica').fillColor('#333333')
           .text(`${data.type.toUpperCase()} ${data.year} RESULT CHECKER`, margin, 22, { align: 'center', width: cardWidth - (margin * 2) });
        
        if (isMultiple) {
          doc.fontSize(6).fillColor('#666666')
             .text(`Card ${index + 1} of ${pins.length}`, margin, 32, { align: 'center', width: cardWidth - (margin * 2) });
        }
        
        // Divider
        doc.moveTo(margin, 40).lineTo(cardWidth - margin, 40).stroke('#cccccc');
        
        // Credentials
        let yPos = 52;
        
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#666666')
           .text('SERIAL NUMBER: ', margin, yPos, { continued: true })
           .fillColor('#000000')
           .text(pinData.serialNumber);
        
        yPos += 14;
        
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#666666')
           .text('PIN: ', margin, yPos, { continued: true })
           .fillColor('#000000')
           .text(pinData.pin);
        
        // Footer
        const footerY = cardHeight - 18;
        doc.moveTo(margin, footerY - 3).lineTo(cardWidth - margin, footerY - 3).stroke('#cccccc');
        
        doc.fontSize(5).font('Helvetica').fillColor('#666666')
           .text(`Ref: ${data.transactionReference} | ${data.purchaseDate.toLocaleDateString()}`, margin, footerY, { align: 'center', width: cardWidth - (margin * 2) });
        
        doc.fontSize(5).fillColor('#999999')
           .text('www.resellershubprogh.com', margin, footerY + 8, { align: 'center', width: cardWidth - (margin * 2) });
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function saveResultCheckerPDF(data: ResultCheckerPDFData, filePath: string): Promise<void> {
  const pdfBuffer = await generateResultCheckerPDF(data);
  await fs.promises.writeFile(filePath, pdfBuffer);
}
