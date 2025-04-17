import Booking from '../../models/Booking.js';
import Checkout from '../../models/Checkout.js';
import Invoice from '../../models/Invoice.js';
import {
  generatePaymentUrl,
  verifyReturnUrl,
  verifyIpnCall,
  getIpnResponse,
  getErrorResponse,
} from '../../services/payment.service.js';
import logger from '../../utils/logger.js';

export const createPayment = async (req, res) => {
  try {
    const { booking_id, payment_method = 'vnpay' } = req.body;
    const user_id = req.user.id;

    // Validate input
    if (!booking_id) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    // Validate payment method
    if (payment_method !== 'vnpay' && payment_method !== 'direct_to_seller') {
      return res
        .status(400)
        .json({
          message: 'Invalid payment method. Use vnpay or direct_to_seller',
        });
    }

    // Check if booking exists
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the booking belongs to the user
    if (booking.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to pay for this booking' });
    }

    // Check if the booking can be paid for
    if (booking.booking_status !== 'pending') {
      return res.status(400).json({
        message: `Cannot process payment for booking with status: ${booking.booking_status}`,
      });
    }

    // Check if there's already a successful checkout for this booking
    const existingCheckouts = await Checkout.findByBookingId(booking_id);
    const successfulCheckout = existingCheckouts.find(
      (checkout) => checkout.payment_status === 'completed'
    );

    if (successfulCheckout) {
      return res
        .status(400)
        .json({ message: 'This booking has already been paid for' });
    }

    // Handle direct-to-seller payment
    if (payment_method === 'direct_to_seller') {
      // Create checkout record for direct payment
      const checkoutData = {
        booking_id,
        payment_method: 'direct_to_seller',
        amount: booking.total_price,
        payment_status: 'awaiting_seller_confirmation',
      };

      const checkout = await Checkout.create(checkoutData);

      logger.info(
        `Created direct-to-seller payment for booking ${booking_id}, checkout ID: ${checkout.checkout_id}`
      );

      return res.status(200).json({
        message:
          'Direct payment to seller initiated. Please contact the seller to arrange payment.',
        checkout_id: checkout.checkout_id,
        payment_status: 'awaiting_seller_confirmation',
        booking_id,
      });
    }

    // Handle VNPay payment
    // Get client IP address
    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    // Generate payment URL
    const orderInfo = `Payment for booking #${booking_id} - ${booking.tour_title}`;
    const { paymentUrl, txnRef } = generatePaymentUrl(
      booking.total_price,
      booking_id,
      orderInfo,
      ipAddr
    );

    // Create checkout record
    const checkoutData = {
      booking_id,
      payment_method: 'vnpay',
      amount: booking.total_price,
      payment_status: 'pending',
      transaction_id: txnRef,
    };

    const checkout = await Checkout.create(checkoutData);

    logger.info(
      `Created VNPay payment for booking ${booking_id}, checkout ID: ${checkout.checkout_id}`
    );

    res.status(200).json({
      message: 'Payment initiated',
      paymentUrl,
      checkout_id: checkout.checkout_id,
      transaction_id: txnRef,
    });
  } catch (error) {
    logger.error(`Error creating payment: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const vnpayReturn = async (req, res) => {
  try {
    // Verify the return URL
    const verify = verifyReturnUrl(req.query);

    if (!verify.isVerified) {
      logger.warn(
        `VNPay return verification failed: ${JSON.stringify(req.query)}`
      );
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?reason=verification`
      );
    }

    if (!verify.isSuccess) {
      logger.warn(`VNPay payment failed: ${JSON.stringify(req.query)}`);
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?reason=payment`
      );
    }

    // Extract transaction reference
    const txnRef = req.query.vnp_TxnRef;

    // Find the checkout by transaction ID
    const checkout = await Checkout.findByTransactionId(txnRef);
    if (!checkout) {
      logger.error(`Checkout not found for transaction: ${txnRef}`);
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?reason=not_found`
      );
    }

    // Update checkout status
    await Checkout.updateStatus(checkout.checkout_id, 'completed', txnRef);

    // Update booking status
    await Booking.updateStatus(checkout.booking_id, 'confirmed');

    // Get booking details
    const booking = await Booking.findById(checkout.booking_id);

    // Create invoice
    const invoiceData = {
      booking_id: checkout.booking_id,
      amount_due: checkout.amount,
      details: JSON.stringify({
        payment_method: 'vnpay',
        transaction_id: txnRef,
        payment_date: new Date().toISOString(),
        tour_title: booking.tour_title,
        departure_date: booking.start_date,
        num_adults: booking.num_adults,
        num_children_120_140: booking.num_children_120_140,
        num_children_100_120: booking.num_children_100_120,
      }),
    };

    await Invoice.create(invoiceData);

    logger.info(
      `Payment successful for booking ${checkout.booking_id}, transaction: ${txnRef}`
    );

    return res.redirect(
      `${process.env.CLIENT_URL}/payment/success?booking_id=${checkout.booking_id}`
    );
  } catch (error) {
    logger.error(`Error processing VNPay return: ${error.message}`);
    return res.redirect(
      `${process.env.CLIENT_URL}/payment/failed?reason=server_error`
    );
  }
};

export const vnpayIPN = async (req, res) => {
  try {
    // Verify the IPN call
    const verify = verifyIpnCall(req.query);

    if (!verify.isVerified) {
      logger.warn(
        `VNPay IPN verification failed: ${JSON.stringify(req.query)}`
      );
      return res.status(200).json(getIpnResponse(false));
    }

    // Extract transaction reference and amount
    const txnRef = req.query.vnp_TxnRef;
    const amount = req.query.vnp_Amount / 100; // VNPay amount is in VND * 100

    // Find the checkout by transaction ID
    const checkout = await Checkout.findByTransactionId(txnRef);
    if (!checkout) {
      logger.error(`Checkout not found for transaction: ${txnRef}`);
      return res.status(200).json(getErrorResponse());
    }

    // Verify amount
    if (parseFloat(checkout.amount) !== parseFloat(amount)) {
      logger.error(
        `Amount mismatch for transaction ${txnRef}: expected ${checkout.amount}, got ${amount}`
      );
      return res.status(200).json(getErrorResponse());
    }

    // Update checkout status
    await Checkout.updateStatus(checkout.checkout_id, 'completed', txnRef);

    // Update booking status
    await Booking.updateStatus(checkout.booking_id, 'confirmed');

    // Get booking details
    const booking = await Booking.findById(checkout.booking_id);

    // Create invoice if it doesn't exist
    const existingInvoice = await Invoice.findByBookingId(checkout.booking_id);

    if (!existingInvoice) {
      const invoiceData = {
        booking_id: checkout.booking_id,
        amount_due: checkout.amount,
        details: JSON.stringify({
          payment_method: 'vnpay',
          transaction_id: txnRef,
          payment_date: new Date().toISOString(),
          tour_title: booking.tour_title,
          departure_date: booking.start_date,
          num_adults: booking.num_adults,
          num_children_120_140: booking.num_children_120_140,
          num_children_100_120: booking.num_children_100_120,
        }),
      };

      await Invoice.create(invoiceData);
    }

    logger.info(
      `IPN confirmed payment for booking ${checkout.booking_id}, transaction: ${txnRef}`
    );

    return res.status(200).json(getIpnResponse(true));
  } catch (error) {
    logger.error(`Error processing VNPay IPN: ${error.message}`);
    return res.status(200).json(getErrorResponse());
  }
};
