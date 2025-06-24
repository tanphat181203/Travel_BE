import { generateInvoiceTemplate } from '../utils/templates/invoice.template.js';
import logger from '../utils/logger.js';
import htmlToPdf from 'html-pdf-node';

export const generateInvoiceHtml = (invoice, booking, tour, user, seller) => {
  try {
    const htmlContent = generateInvoiceTemplate(
      invoice,
      booking,
      tour,
      user,
      seller
    );

    logger.info(`Generated HTML invoice for invoice ID: ${invoice.invoice_id}`);

    return htmlContent;
  } catch (error) {
    logger.error(`Error generating HTML invoice: ${error.message}`);
    throw error;
  }
};

/**
 * Generate a PDF buffer from invoice HTML
 * @param {Object} invoice - Invoice data
 * @param {Object} booking - Booking data
 * @param {Object} tour - Tour data
 * @param {Object} user - User data
 * @param {Object} seller - Seller data
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateInvoicePdf = async (invoice, booking, tour, user, seller) => {
  try {
    const htmlContent = generateInvoiceHtml(invoice, booking, tour, user, seller);
    
    const file = { content: htmlContent };
    const options = { 
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    };
    
    const pdfBuffer = await htmlToPdf.generatePdf(file, options);
    
    logger.info(`Generated PDF invoice for invoice ID: ${invoice.invoice_id}`);
    
    return pdfBuffer;
  } catch (error) {
    logger.error(`Error generating PDF invoice: ${error.message}`);
    throw error;
  }
};
