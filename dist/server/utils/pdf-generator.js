import PDFDocument from 'pdfkit';
import fs from 'fs';
export function generateResultCheckerPDF(data) {
    return new Promise((resolve, reject) => {
        try {
            const isMultiple = data.pins && data.pins.length > 1;
            const pins = data.pins || (data.pin && data.serialNumber ? [{ pin: data.pin, serialNumber: data.serialNumber }] : []);
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `${data.type.toUpperCase()} Result Checker ${data.year}`,
                    Author: 'resellershubprogh.com',
                    Subject: 'Result Checker Credentials',
                }
            });
            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('RESELLERSHUBPROGH.COM', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(18).font('Helvetica-Bold').text(`${data.type.toUpperCase()} RESULT CHECKER ${data.year}`, { align: 'center' });
            if (isMultiple) {
                doc.moveDown(0.5);
                doc.fontSize(14).font('Helvetica').text(`${pins.length} Result Checkers Purchased`, { align: 'center' });
            }
            doc.moveDown(1);
            let currentY = 180;
            // Render each PIN
            pins.forEach((pinData, index) => {
                // Check if we need a new page
                if (currentY > 650) {
                    doc.addPage();
                    currentY = 50;
                }
                // Border for each credential
                const boxHeight = isMultiple ? 120 : 300;
                doc.rect(50, currentY - 30, 495, boxHeight).stroke();
                // Title for each credential
                if (isMultiple) {
                    doc.fontSize(14).font('Helvetica-Bold').text(`Checker #${index + 1}`, { align: 'center' });
                    doc.moveDown(0.5);
                }
                else {
                    doc.fontSize(16).font('Helvetica-Bold').text('RESULT CHECKER CREDENTIALS', { align: 'center' });
                    doc.moveDown(1);
                }
                // Credentials
                doc.fontSize(14).font('Helvetica-Bold').text('Serial Number:', 100, currentY);
                doc.fontSize(14).font('Helvetica').text(pinData.serialNumber, 220, currentY);
                doc.fontSize(14).font('Helvetica-Bold').text('PIN:', 100, currentY + 25);
                doc.fontSize(14).font('Helvetica').text(pinData.pin, 220, currentY + 25);
                currentY += boxHeight + 20;
                if (!isMultiple) {
                    currentY = 300; // Position for customer info in single PIN mode
                }
            });
            // Customer information (after all PINs)
            if (isMultiple) {
                currentY += 10;
            }
            // Customer information
            if (data.customerName) {
                doc.fontSize(12).font('Helvetica-Bold').text('Customer Name:', 100, currentY);
                doc.fontSize(12).font('Helvetica').text(data.customerName, 220, currentY);
                currentY += 20;
            }
            if (data.customerPhone) {
                doc.fontSize(12).font('Helvetica-Bold').text('Phone Number:', 100, currentY);
                doc.fontSize(12).font('Helvetica').text(data.customerPhone, 220, currentY);
                currentY += 20;
            }
            doc.fontSize(12).font('Helvetica-Bold').text('Purchase Date:', 100, currentY);
            doc.fontSize(12).font('Helvetica').text(data.purchaseDate.toLocaleDateString(), 220, currentY);
            currentY += 20;
            doc.fontSize(12).font('Helvetica-Bold').text('Transaction Ref:', 100, currentY);
            doc.fontSize(12).font('Helvetica').text(data.transactionReference, 220, currentY);
            currentY += 30;
            doc.moveDown(2);
            // Instructions
            doc.fontSize(10).font('Helvetica-Bold').text('INSTRUCTIONS:', 100, currentY);
            currentY += 15;
            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica').text('1. Visit the official result checking portal for your examination body.', 100, currentY);
            doc.text('2. Enter your PIN and Serial Number when prompted.', 100, currentY + 15);
            doc.text('3. Keep this document safe and do not share your credentials with others.', 100, currentY + 30);
            doc.text('4. For support, contact resellershubprogh.com.', 100, currentY + 45);
            // Footer
            doc.moveDown(2);
            doc.fontSize(8).font('Helvetica').text('This document was generated electronically and is valid for result checking purposes.', { align: 'center' });
            doc.text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
}
export async function saveResultCheckerPDF(data, filePath) {
    const pdfBuffer = await generateResultCheckerPDF(data);
    await fs.promises.writeFile(filePath, pdfBuffer);
}
