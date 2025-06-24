import Invoice from '../../models/Invoice.js';
import Booking from '../../models/Booking.js';
import { generateInvoiceHtml, generateInvoicePdf } from '../../services/invoice.service.js';
import { sendHtmlEmail } from '../../services/email.service.js';
import logger from '../../utils/logger.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const getUserInvoices = async (req, res) => {
  try {
    const user_id = req.user.id;

    const { page, limit, offset } = getPaginationParams(req.query);

    const { invoices, totalItems } = await Invoice.findByUserId(
      user_id,
      limit,
      offset
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${invoices.length} invoices for user ${user_id} (page ${page})`
    );

    res.status(200).json({
      invoices,
      pagination,
    });
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

    if (invoice.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to access this invoice' });
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

    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to access this booking' });
    }

    const invoice = await Invoice.findByBookingId(booking_id);

    if (!invoice) {
      return res
        .status(404)
        .json({ message: 'Invoice not found for this booking' });
    }

    logger.info(`Retrieved invoice for booking ${booking_id}`);

    res.status(200).json({ invoice });
  } catch (error) {
    logger.error(`Error getting invoice by booking ID: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const viewInvoiceHtml = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to access this invoice' });
    }

    const booking = await Booking.findById(invoice.booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Parse invoice details
    const details = typeof invoice.details === 'string'
      ? JSON.parse(invoice.details)
      : invoice.details || {};

    // Ensure booking data includes JSON fields parsed properly
    const bookingData = {
      ...booking,
      contact_info: typeof booking.contact_info === 'string' 
        ? JSON.parse(booking.contact_info) 
        : booking.contact_info,
      passengers: typeof booking.passengers === 'string' 
        ? JSON.parse(booking.passengers) 
        : booking.passengers,
      order_notes: typeof booking.order_notes === 'string' 
        ? JSON.parse(booking.order_notes) 
        : booking.order_notes,
      // Include price information from invoice details or departure data
      price_adult: details.price_adult || invoice.price_adult,
      price_child_120_140: details.price_child_120_140 || invoice.price_child_120_140,
      price_child_100_120: details.price_child_100_120 || invoice.price_child_100_120
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
      id: invoice.seller_id,
      name: invoice.seller_name,
      email: invoice.seller_email,
      phone_number: invoice.seller_phone,
      address: invoice.seller_address,
      avatar_url: invoice.seller_avatar_url,
    };

    try {
      const htmlContent = generateInvoiceHtml(
        invoice,
        bookingData,
        tour,
        user,
        seller
      );

      res.setHeader('Content-Type', 'text/html');

      logger.info(`Generated HTML invoice ${id} for user ${user_id}`);

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
    const user_id = req.user.id;

    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to access this booking' });
    }

    const invoice = await Invoice.findByBookingId(booking_id);

    if (!invoice) {
      return res
        .status(404)
        .json({ message: 'Invoice not found for this booking' });
    }

    // Parse invoice details
    const details = typeof invoice.details === 'string'
      ? JSON.parse(invoice.details)
      : invoice.details || {};

    // Ensure booking data includes JSON fields parsed properly
    const bookingData = {
      ...booking,
      contact_info: typeof booking.contact_info === 'string' 
        ? JSON.parse(booking.contact_info) 
        : booking.contact_info,
      passengers: typeof booking.passengers === 'string' 
        ? JSON.parse(booking.passengers) 
        : booking.passengers,
      order_notes: typeof booking.order_notes === 'string' 
        ? JSON.parse(booking.order_notes) 
        : booking.order_notes,
      // Include price information from invoice details or departure data
      price_adult: details.price_adult || invoice.price_adult,
      price_child_120_140: details.price_child_120_140 || invoice.price_child_120_140,
      price_child_100_120: details.price_child_100_120 || invoice.price_child_100_120
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
      id: invoice.seller_id,
      name: invoice.seller_name,
      email: invoice.seller_email,
      phone_number: invoice.seller_phone,
      address: invoice.seller_address,
      avatar_url: invoice.seller_avatar_url,
    };

    try {
      const htmlContent = generateInvoiceHtml(
        invoice,
        bookingData,
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

export const sendInvoiceByEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to access this invoice' });
    }

    const booking = await Booking.findById(invoice.booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Parse invoice details
    const details = typeof invoice.details === 'string'
      ? JSON.parse(invoice.details)
      : invoice.details || {};

    // Ensure booking data includes JSON fields parsed properly
    const bookingData = {
      ...booking,
      contact_info: typeof booking.contact_info === 'string' 
        ? JSON.parse(booking.contact_info) 
        : booking.contact_info,
      passengers: typeof booking.passengers === 'string' 
        ? JSON.parse(booking.passengers) 
        : booking.passengers,
      order_notes: typeof booking.order_notes === 'string' 
        ? JSON.parse(booking.order_notes) 
        : booking.order_notes,
      // Include price information from invoice details or departure data
      price_adult: details.price_adult || invoice.price_adult,
      price_child_120_140: details.price_child_120_140 || invoice.price_child_120_140,
      price_child_100_120: details.price_child_100_120 || invoice.price_child_100_120
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
      id: invoice.seller_id,
      name: invoice.seller_name,
      email: invoice.seller_email,
      phone_number: invoice.seller_phone,
      address: invoice.seller_address,
      avatar_url: invoice.seller_avatar_url,
    };

    try {
      // Generate PDF
      const pdfBuffer = await generateInvoicePdf(
        invoice,
        bookingData,
        tour,
        user,
        seller
      );
      
      // Send email with PDF attachment
      const emailSubject = `Hóa đơn cho đơn đặt tour #${booking.booking_id}`;
      const emailHtml = `
        <h1>Hóa đơn đặt tour của bạn</h1>
        <p>Xin chào ${user.name},</p>
        <p>Theo yêu cầu của bạn, chúng tôi đã đính kèm hóa đơn cho tour "${tour.title}" trong email này.</p>
        <p>Chi tiết đơn hàng:</p>
        <ul>
          <li>Mã đơn hàng: ${booking.booking_id}</li>
          <li>Tour: ${tour.title}</li>
          <li>Ngày khởi hành: ${new Date(booking.start_date).toLocaleDateString('vi-VN')}</li>
          <li>Tổng thanh toán: ${(invoice.amount_due || 0).toLocaleString('vi-VN')} VND</li>
        </ul>
        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
        <p>Trân trọng,<br>${seller.name}</p>
      `;
      
      await sendHtmlEmail(
        user.email,
        emailSubject,
        emailHtml,
        [
          {
            filename: `hoa-don-${booking.booking_id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      );

      logger.info(`User ${user_id} requested invoice ${id} via email to ${user.email}`);

      res.status(200).json({ 
        message: `Hóa đơn đã được gửi thành công đến ${user.email}` 
      });
    } catch (emailError) {
      logger.error(`Error sending invoice email: ${emailError.message}`);
      throw emailError;
    }
  } catch (error) {
    logger.error(`Error sending invoice email: ${error.message}`);
    res
      .status(500)
      .json({ message: 'Error sending invoice email', error: error.message });
  }
};

export const sendInvoiceByBookingId = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.id;

    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to access this booking' });
    }

    const invoice = await Invoice.findByBookingId(booking_id);

    if (!invoice) {
      return res
        .status(404)
        .json({ message: 'Invoice not found for this booking' });
    }

    // Parse invoice details
    const details = typeof invoice.details === 'string'
      ? JSON.parse(invoice.details)
      : invoice.details || {};

    // Ensure booking data includes JSON fields parsed properly
    const bookingData = {
      ...booking,
      contact_info: typeof booking.contact_info === 'string' 
        ? JSON.parse(booking.contact_info) 
        : booking.contact_info,
      passengers: typeof booking.passengers === 'string' 
        ? JSON.parse(booking.passengers) 
        : booking.passengers,
      order_notes: typeof booking.order_notes === 'string' 
        ? JSON.parse(booking.order_notes) 
        : booking.order_notes,
      // Include price information from invoice details or departure data
      price_adult: details.price_adult || invoice.price_adult,
      price_child_120_140: details.price_child_120_140 || invoice.price_child_120_140,
      price_child_100_120: details.price_child_100_120 || invoice.price_child_100_120
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
      id: invoice.seller_id,
      name: invoice.seller_name,
      email: invoice.seller_email,
      phone_number: invoice.seller_phone,
      address: invoice.seller_address,
      avatar_url: invoice.seller_avatar_url,
    };

    try {
      // Generate PDF
      const pdfBuffer = await generateInvoicePdf(
        invoice,
        bookingData,
        tour,
        user,
        seller
      );
      
      // Send email with PDF attachment
      const emailSubject = `Hóa đơn cho đơn đặt tour #${booking.booking_id}`;
      const emailHtml = `
        <h1>Hóa đơn đặt tour của bạn</h1>
        <p>Xin chào ${user.name},</p>
        <p>Theo yêu cầu của bạn, chúng tôi đã đính kèm hóa đơn cho tour "${tour.title}" trong email này.</p>
        <p>Chi tiết đơn hàng:</p>
        <ul>
          <li>Mã đơn hàng: ${booking.booking_id}</li>
          <li>Tour: ${tour.title}</li>
          <li>Ngày khởi hành: ${new Date(booking.start_date).toLocaleDateString('vi-VN')}</li>
          <li>Tổng thanh toán: ${(invoice.amount_due || 0).toLocaleString('vi-VN')} VND</li>
        </ul>
        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
        <p>Trân trọng,<br>${seller.name}</p>
      `;
      
      await sendHtmlEmail(
        user.email,
        emailSubject,
        emailHtml,
        [
          {
            filename: `hoa-don-${booking.booking_id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      );

      logger.info(`User ${user_id} requested invoice for booking ${booking_id} via email to ${user.email}`);

      res.status(200).json({ 
        message: `Hóa đơn đã được gửi thành công đến ${user.email}` 
      });
    } catch (emailError) {
      logger.error(`Error sending invoice email: ${emailError.message}`);
      throw emailError;
    }
  } catch (error) {
    logger.error(`Error sending invoice email: ${error.message}`);
    res
      .status(500)
      .json({ message: 'Error sending invoice email', error: error.message });
  }
};
