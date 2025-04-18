import dotenv from 'dotenv';
dotenv.config();

import Booking from '../../models/Booking.js';
import Checkout from '../../models/Checkout.js';
import Invoice from '../../models/Invoice.js';
import {
  generatePaymentUrl,
  verifyReturnUrl,
  verifyIpnCall,
  getIpnResponse,
  getErrorResponse,
  constructStripeEvent,
  createStripeCheckoutSession,
} from '../../services/payment.service.js';
import logger from '../../utils/logger.js';

export const createPayment = async (req, res) => {
  try {
    const { booking_id, payment_method = 'vnpay' } = req.body;
    const user_id = req.user.id;

    if (!booking_id) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    if (
      payment_method !== 'vnpay' &&
      payment_method !== 'direct_to_seller' &&
      payment_method !== 'stripe'
    ) {
      return res.status(400).json({
        message:
          'Invalid payment method. Use vnpay, stripe, or direct_to_seller',
      });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

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

    // Handle Stripe payment
    if (payment_method === 'stripe') {
      // Create a checkout session with Stripe to get a payment URL
      const orderInfo = `Payment for booking #${booking_id} - ${booking.tour_title}`;
      const session = await createStripeCheckoutSession(
        booking.total_price,
        booking_id,
        orderInfo
      );

      // Create checkout record
      const checkoutData = {
        booking_id,
        payment_method: 'stripe',
        amount: booking.total_price,
        payment_status: 'pending',
        transaction_id: session.id,
      };

      const checkout = await Checkout.create(checkoutData);

      logger.info(
        `Created Stripe payment for booking ${booking_id}, checkout ID: ${checkout.checkout_id}, session id: ${session.id}`
      );

      return res.status(200).json({
        message: 'Stripe payment initiated',
        paymentUrl: session.url,
        checkout_id: checkout.checkout_id,
        transaction_id: session.id,
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
        `${process.env.CLIENT_URL}/payment/failed?payment_method=vnpay&reason=verification`
      );
    }

    if (!verify.isSuccess) {
      logger.warn(`VNPay payment failed: ${JSON.stringify(req.query)}`);
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?payment_method=vnpay&reason=payment`
      );
    }

    // Extract transaction reference
    const txnRef = req.query.vnp_TxnRef;

    // Find the checkout by transaction ID
    const checkout = await Checkout.findByTransactionId(txnRef);
    if (!checkout) {
      logger.error(`Checkout not found for transaction: ${txnRef}`);
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failed?payment_method=vnpay&reason=not_found`
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
      `${process.env.CLIENT_URL}/payment/success?payment_method=vnpay&booking_id=${checkout.booking_id}`
    );
  } catch (error) {
    logger.error(`Error processing VNPay return: ${error.message}`);
    return res.redirect(
      `${process.env.CLIENT_URL}/payment/failed?payment_method=vnpay&reason=server_error`
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

export const stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    // For Stripe webhooks, req.body is a raw buffer that we need to pass directly to the constructStripeEvent function for signature verification
    const event = constructStripeEvent(req.body, signature);

    // Handle the event based on its type
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata.booking_id;

      logger.info(
        `Stripe checkout session completed for booking ${bookingId}, session id: ${session.id}`
      );

      // Find the checkout by transaction ID (session ID)
      const checkout = await Checkout.findByTransactionId(session.id);
      if (!checkout) {
        logger.error(`Checkout not found for session id: ${session.id}`);
        return res.status(400).json({ error: 'Checkout not found' });
      }

      // Update checkout status
      await Checkout.updateStatus(
        checkout.checkout_id,
        'completed',
        session.id
      );

      // Update booking status
      await Booking.updateStatus(checkout.booking_id, 'confirmed');

      // Get booking details
      const booking = await Booking.findById(checkout.booking_id);

      // Create invoice if it doesn't exist
      const existingInvoice = await Invoice.findByBookingId(
        checkout.booking_id
      );

      if (!existingInvoice) {
        const invoiceData = {
          booking_id: checkout.booking_id,
          amount_due: checkout.amount,
          details: JSON.stringify({
            payment_method: 'stripe',
            transaction_id: session.id,
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
        `Webhook confirmed Stripe payment for booking ${checkout.booking_id}`
      );
    }
    // Also handle payment_intent events for backward compatibility
    else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata.booking_id;

      logger.info(
        `Stripe payment intent succeeded for booking ${bookingId}, payment intent: ${paymentIntent.id}`
      );

      // Find the checkout by transaction ID (payment intent ID)
      const checkout = await Checkout.findByTransactionId(paymentIntent.id);
      if (checkout) {
        // Update checkout status
        await Checkout.updateStatus(
          checkout.checkout_id,
          'completed',
          paymentIntent.id
        );

        // Update booking status
        await Booking.updateStatus(checkout.booking_id, 'confirmed');

        // Get booking details
        const booking = await Booking.findById(checkout.booking_id);

        // Create invoice if it doesn't exist
        const existingInvoice = await Invoice.findByBookingId(
          checkout.booking_id
        );

        if (!existingInvoice) {
          const invoiceData = {
            booking_id: checkout.booking_id,
            amount_due: checkout.amount,
            details: JSON.stringify({
              payment_method: 'stripe',
              transaction_id: paymentIntent.id,
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
          `Webhook confirmed Stripe payment for booking ${checkout.booking_id}`
        );
      }
    } else if (
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      // Handle both payment intent failures and session expirations
      const object = event.data.object;
      const bookingId = object.metadata.booking_id;
      const objectId = object.id;

      logger.warn(
        `Stripe payment failed for booking ${bookingId}, id: ${objectId}`
      );

      // Find the checkout by transaction ID
      const checkout = await Checkout.findByTransactionId(objectId);
      if (checkout) {
        // Update checkout status to failed
        await Checkout.updateStatus(checkout.checkout_id, 'failed', objectId);
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error processing Stripe webhook: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};
