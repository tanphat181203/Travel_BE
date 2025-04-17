import { generateInvoiceTemplate } from '../utils/templates/invoice.template.js';
import logger from '../utils/logger.js';

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
