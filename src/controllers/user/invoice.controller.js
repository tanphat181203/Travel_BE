import Invoice from '../../models/Invoice.js';
import Booking from '../../models/Booking.js';
import logger from '../../utils/logger.js';

export const getUserInvoices = async (req, res) => {
  try {
    const user_id = req.user.id;
    const invoices = await Invoice.findByUserId(user_id);
    
    logger.info(`Retrieved ${invoices.length} invoices for user ${user_id}`);
    
    res.status(200).json({ invoices });
  } catch (error) {
    logger.error(`Error getting user invoices: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const invoice = await Invoice.findById(id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Check if the invoice belongs to the user
    if (invoice.user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to access this invoice' });
    }
    
    logger.info(`Retrieved invoice ${id} for user ${user_id}`);
    
    res.status(200).json({ invoice });
  } catch (error) {
    logger.error(`Error getting invoice by ID: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getInvoiceByBookingId = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.id;
    
    // Check if the booking belongs to the user
    const booking = await Booking.findById(booking_id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to access this booking' });
    }
    
    const invoice = await Invoice.findByBookingId(booking_id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found for this booking' });
    }
    
    logger.info(`Retrieved invoice for booking ${booking_id}`);
    
    res.status(200).json({ invoice });
  } catch (error) {
    logger.error(`Error getting invoice by booking ID: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
