import PDFDocument from 'pdfkit';
import fs from 'fs';
export function generateResultCheckerPDF(data) {
    return new Promise((resolve, reject) => {
        try {
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
            doc.moveDown(1);
            // Border
            doc.rect(50, 150, 495, 300).stroke();
            doc.moveDown(2);
            // Title
            doc.fontSize(16).font('Helvetica-Bold').text('RESULT CHECKER CREDENTIALS', { align: 'center' });
            doc.moveDown(1);
            // Credentials section
            doc.fontSize(14).font('Helvetica-Bold').text('PIN:', 100, 220);
            doc.fontSize(14).font('Helvetica').text(data.pin, 200, 220);
            doc.fontSize(14).font('Helvetica-Bold').text('Serial Number:', 100, 250);
            doc.fontSize(14).font('Helvetica').text(data.serialNumber, 200, 250);
            doc.moveDown(2);
            // Customer information
            if (data.customerName) {
                doc.fontSize(12).font('Helvetica-Bold').text('Customer Name:', 100, 300);
                doc.fontSize(12).font('Helvetica').text(data.customerName, 200, 300);
            }
            if (data.customerPhone) {
                doc.fontSize(12).font('Helvetica-Bold').text('Phone Number:', 100, 320);
                doc.fontSize(12).font('Helvetica').text(data.customerPhone, 200, 320);
            }
            doc.fontSize(12).font('Helvetica-Bold').text('Purchase Date:', 100, 340);
            doc.fontSize(12).font('Helvetica').text(data.purchaseDate.toLocaleDateString(), 200, 340);
            doc.fontSize(12).font('Helvetica-Bold').text('Transaction Ref:', 100, 360);
            doc.fontSize(12).font('Helvetica').text(data.transactionReference, 200, 360);
            doc.moveDown(2);
            // Instructions
            doc.fontSize(10).font('Helvetica-Bold').text('INSTRUCTIONS:', 100, 400);
            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica').text('1. Visit the official result checking portal for your examination body.', 100, 420);
            doc.text('2. Enter your PIN and Serial Number when prompted.', 100, 435);
            doc.text('3. Keep this document safe and do not share your credentials with others.', 100, 450);
            doc.text('4. For support, contact resellershubprogh.com.', 100, 465);
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
