import Invoice from '../../models/Invoice.js';
import { generateInvoiceHtml } from '../../services/invoice.service.js';
import logger from '../../utils/logger.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const getSellerInvoices = async (req, res) => {
  try {
    const sellerId = req.userId;

    const { page, limit, offset } = getPaginationParams(req.query);

    const { invoices, totalItems } = await Invoice.findBySellerId(
      sellerId,
      limit,
      offset
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${invoices.length} invoices for seller ${sellerId} (page ${page})`
    );

    res.status(200).json({
      invoices,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting seller invoices: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.userId;

    const ownershipCheck = await Invoice.checkOwnership(id, sellerId);
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    const invoice = await Invoice.findById(id);

    logger.info(`Retrieved invoice ${id} for seller ${sellerId}`);

    res.status(200).json({ invoice });
  } catch (error) {
    logger.error(`Error getting invoice by ID: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const viewInvoiceHtml = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.userId;

    const ownershipCheck = await Invoice.checkOwnership(id, sellerId);
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    const invoice = await Invoice.findById(id);

    const booking = {
      booking_id: invoice.booking_id,
      user_id: invoice.user_id,
      departure_id: invoice.departure_id,
      num_adults: invoice.num_adults,
      num_children_120_140: invoice.num_children_120_140,
      num_children_100_120: invoice.num_children_100_120,
      start_date: invoice.start_date,
      price_adult: invoice.price_adult,
      price_child_120_140: invoice.price_child_120_140,
      price_child_100_120: invoice.price_child_100_120,
    };

    const tour = {
      tour_id: invoice.tour_id,
      title: invoice.tour_title,
      departure_location: invoice.departure_location,
      seller_id: invoice.seller_id,
      duration: invoice.duration,
    };

    const user = {
      id: invoice.user_id,
      name: invoice.user_name,
      email: invoice.user_email,
      phone_number: invoice.user_phone,
      address: invoice.user_address,
    };

    const seller = {
      id: sellerId,
      name: invoice.seller_name,
      email: invoice.seller_email,
      phone_number: invoice.seller_phone,
      address: invoice.seller_address,
      avatar_url: invoice.seller_avatar_url,
    };

    try {
      const htmlContent = generateInvoiceHtml(
        invoice,
        booking,
        tour,
        user,
        seller
      );

      res.setHeader('Content-Type', 'text/html');

      logger.info(`Generated HTML invoice ${id} for seller ${sellerId}`);

      res.send(htmlContent);
    } catch (htmlError) {
      logger.error(`Error in HTML generation: ${htmlError.message}`);
      throw htmlError;
    }
  } catch (error) {
    logger.error(`Error generating HTML invoice: ${error.message}`);
    res
      .status(500)
      .json({ message: 'Error generating HTML invoice', error: error.message });
  }
};

export const viewInvoiceHtmlByBookingId = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const sellerId = req.userId;

    const ownershipCheck = await Invoice.checkBookingOwnership(
      booking_id,
      sellerId
    );
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    const invoice = await Invoice.findByBookingId(booking_id);

    if (!invoice) {
      return res
        .status(404)
        .json({ message: 'Invoice not found for this booking' });
    }

    const booking = {
      booking_id: invoice.booking_id,
      user_id: invoice.user_id,
      departure_id: invoice.departure_id,
      num_adults: invoice.num_adults,
      num_children_120_140: invoice.num_children_120_140,
      num_children_100_120: invoice.num_children_100_120,
      start_date: invoice.start_date,
      price_adult: invoice.price_adult,
      price_child_120_140: invoice.price_child_120_140,
      price_child_100_120: invoice.price_child_100_120,
    };

    const tour = {
      tour_id: invoice.tour_id,
      title: invoice.tour_title,
      departure_location: invoice.departure_location,
      seller_id: invoice.seller_id,
      duration: invoice.duration,
    };

    const user = {
      id: invoice.user_id,
      name: invoice.user_name,
      email: invoice.user_email,
      phone_number: invoice.user_phone,
      address: invoice.user_address,
    };

    const seller = {
      id: sellerId,
      name: invoice.seller_name,
      email: invoice.seller_email,
      phone_number: invoice.seller_phone,
      address: invoice.seller_address,
      avatar_url: invoice.seller_avatar_url,
    };

    try {
      const htmlContent = generateInvoiceHtml(
        invoice,
        booking,
        tour,
        user,
        seller
      );

      res.setHeader('Content-Type', 'text/html');

      logger.info(`Generated HTML invoice for booking ${booking_id}`);

      res.send(htmlContent);
    } catch (htmlError) {
      logger.error(`Error in HTML generation: ${htmlError.message}`);
      throw htmlError;
    }
  } catch (error) {
    logger.error(`Error generating HTML invoice: ${error.message}`);
    res
      .status(500)
      .json({ message: 'Error generating HTML invoice', error: error.message });
  }
};
