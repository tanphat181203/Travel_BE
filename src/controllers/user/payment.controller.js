import dotenv from 'dotenv';
dotenv.config();

import Booking from '../../models/Booking.js';
import Checkout from '../../models/Checkout.js';
import Invoice from '../../models/Invoice.js';
import User from '../../models/User.js';
import SellerSubscription from '../../models/SellerSubscription.js';
import SubscriptionInvoice from '../../models/SubscriptionInvoice.js';
import {
  generatePaymentUrl,
  verifyReturnUrl,
  verifyIpnCall,
  getIpnResponse,
  getErrorResponse,
  retrievePaymentIntent,
  constructStripeEvent,
  createStripeCheckoutSession,
  createOrGetStripeCustomer,
  createEphemeralKey,
  createMobilePaymentIntent,
} from '../../services/payment.service.js';
import logger from '../../utils/logger.js';
import { trackTourBooking } from '../../services/history.service.js';
import { generateInvoicePdf } from '../../services/invoice.service.js';
import { sendHtmlEmail } from '../../services/email.service.js';

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
        original_price: booking.original_price,
        discount: booking.discount,
        promotion_id: booking.promotion_id,
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

const sendInvoiceByEmail = async (bookingId, userId) => {
  try {
    // Get invoice data
    const invoice = await Invoice.findByBookingId(bookingId);
    if (!invoice) {
      logger.error(`Invoice not found for booking ${bookingId}`);
      return;
    }
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found for ID ${userId}`);
      return;
    }
    
    // Parse invoice details
    const details = typeof invoice.details === 'string'
      ? JSON.parse(invoice.details)
      : invoice.details || {};
    
    // Add booking details from the invoice
    const booking = {
      booking_id: invoice.booking_id,
      user_id: invoice.user_id,
      departure_id: invoice.departure_id,
      num_adults: invoice.num_adults,
      num_children_120_140: invoice.num_children_120_140,
      num_children_100_120: invoice.num_children_100_120,
      start_date: invoice.start_date,
      // Use price data from details or from invoice
      price_adult: details.price_adult || invoice.price_adult,
      price_child_120_140: details.price_child_120_140 || invoice.price_child_120_140,
      price_child_100_120: details.price_child_100_120 || invoice.price_child_100_120
    };
      
    // Add JSON data from invoice details
    if (details.contact_info) booking.contact_info = details.contact_info;
    if (details.passengers) booking.passengers = details.passengers;
    if (details.order_notes) booking.order_notes = details.order_notes;

    const tour = {
      tour_id: invoice.tour_id,
      title: invoice.tour_title,
      departure_location: invoice.departure_location,
      seller_id: invoice.seller_id,
      duration: invoice.duration,
    };

    const userData = {
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

    // Generate PDF
    const pdfBuffer = await generateInvoicePdf(invoice, booking, tour, userData, seller);
    
    // Send email with PDF attachment
    const emailSubject = `Hóa đơn cho đơn đặt tour #${booking.booking_id}`;
    const emailHtml = `
      <h1>Cảm ơn bạn đã đặt tour!</h1><br>
      <p>Xin chào <strong>${userData.name}</strong>,</p>
      <p>Cảm ơn bạn đã đặt tour "<strong>${tour.title}</strong>" của chúng tôi.</p>
      <p>Chúng tôi đã đính kèm hóa đơn chi tiết trong email này.</p>
      <p><strong>Chi tiết đơn hàng:</strong></p>
      <ul>
        <li><strong>Mã đơn hàng:</strong> ${booking.booking_id}</li>
        <li><strong>Tour:</strong> ${tour.title}</li>
        <li><strong>Ngày khởi hành:</strong> ${new Date(booking.start_date).toLocaleDateString('vi-VN')}</li>
        <li><strong>Tổng thanh toán:</strong> ${(invoice.amount_due || 0).toLocaleString('vi-VN')} VND</li>
      </ul>
      <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
      <p>Trân trọng,<br>
      Đội ngũ ${seller.name}<br>
      Hotline: ${seller.phone_number}<br>
      Địa chỉ: ${seller.address}</p>
    `;
    
    await sendHtmlEmail(
      userData.email,
      emailSubject,
      emailHtml,
      [
        {
          filename: `Hoa-don-${booking.booking_id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    );
    
    logger.info(`Sent invoice email for booking ${bookingId} to ${userData.email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending invoice email: ${error.message}`);
    return false;
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
          original_price: booking.original_price,
          discount: booking.discount,
          promotion_id: booking.promotion_id,
        }),
      };

      await Invoice.create(invoiceData);
    }

    if (booking.user_id && booking.tour_id) {
      trackTourBooking(booking.user_id, booking.tour_id).catch(error => {
        logger.error(`Error tracking tour booking: ${error.message}`);
      });
      
      // Send invoice by email
      sendInvoiceByEmail(checkout.booking_id, booking.user_id).catch(error => {
        logger.error(`Error sending invoice email: ${error.message}`);
      });
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

      // Check if this is a subscription payment
      if (session.metadata.subscription_id) {
        const subscriptionId = session.metadata.subscription_id;

        logger.info(
          `Stripe checkout session completed for subscription ${subscriptionId}, session id: ${session.id}`
        );

        // Find the subscription invoice by transaction ID
        const invoice = await SubscriptionInvoice.findByTransactionId(
          session.id
        );
        if (!invoice) {
          logger.error(
            `Subscription invoice not found for session id: ${session.id}`
          );
          return res
            .status(400)
            .json({ error: 'Subscription invoice not found' });
        }

        // Update subscription status
        await SellerSubscription.updateStatus(
          invoice.subscription_id,
          'active',
          session.id
        );

        logger.info(
          `Webhook confirmed Stripe payment for subscription ${invoice.subscription_id}`
        );
      }
      // Handle booking payment
      else if (session.metadata.booking_id) {
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

        if (booking.user_id && booking.tour_id) {
          trackTourBooking(booking.user_id, booking.tour_id).catch(error => {
            logger.error(`Error tracking tour booking: ${error.message}`);
          });
          
          // Send invoice by email
          sendInvoiceByEmail(checkout.booking_id, booking.user_id).catch(error => {
            logger.error(`Error sending invoice email: ${error.message}`);
          });
        }

        logger.info(
          `Webhook confirmed Stripe payment for booking ${checkout.booking_id}`
        );
      } else {
        logger.warn(
          `Stripe checkout session completed but no booking_id or subscription_id found in metadata: ${session.id}`
        );
      }
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

        if (booking.user_id && booking.tour_id) {
          trackTourBooking(booking.user_id, booking.tour_id).catch(error => {
            logger.error(`Error tracking tour booking: ${error.message}`);
          });
          
          // Send invoice by email
          sendInvoiceByEmail(checkout.booking_id, booking.user_id).catch(error => {
            logger.error(`Error sending invoice email: ${error.message}`);
          });
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
      const objectId = object.id;

      // Check if this is a subscription payment
      if (object.metadata.subscription_id) {
        const subscriptionId = object.metadata.subscription_id;

        logger.warn(
          `Stripe payment failed for subscription ${subscriptionId}, id: ${objectId}`
        );

        // Find the subscription by transaction ID
        const invoice = await SubscriptionInvoice.findByTransactionId(objectId);
        if (invoice) {
          // Update subscription status to failed
          await SellerSubscription.updateStatus(
            invoice.subscription_id,
            'failed',
            objectId
          );
        }
      }
      // Handle booking payment failure
      else if (object.metadata.booking_id) {
        const bookingId = object.metadata.booking_id;

        logger.warn(
          `Stripe payment failed for booking ${bookingId}, id: ${objectId}`
        );

        // Find the checkout by transaction ID
        const checkout = await Checkout.findByTransactionId(objectId);
        if (checkout) {
          // Update checkout status to failed
          await Checkout.updateStatus(checkout.checkout_id, 'failed', objectId);
        }
      } else {
        logger.warn(
          `Stripe payment failed but no booking_id or subscription_id found in metadata: ${objectId}`
        );
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error processing Stripe webhook: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const createMobilePayment = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const user_id = req.user.id;

    if (!booking_id) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Unauthorized access to booking' });
    }

    if (booking.booking_status !== 'pending') {
      return res.status(400).json({
        message: 'Booking is not available for payment',
        current_status: booking.booking_status,
      });
    }

    const existingCheckouts = await Checkout.findByBookingId(booking_id);
    const existingCheckout =
      existingCheckouts && existingCheckouts.length > 0
        ? existingCheckouts.find(
            (c) =>
              c.payment_method === 'stripe_mobile' &&
              c.payment_status !== 'completed'
          )
        : null;

    if (
      existingCheckouts &&
      existingCheckouts.some((c) => c.payment_status === 'completed')
    ) {
      return res.status(400).json({
        message: 'Payment already completed for this booking',
      });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const customer = await createOrGetStripeCustomer(
      user_id,
      user.email,
      user.name
    );

    const ephemeralKey = await createEphemeralKey(customer.id);

    const paymentIntent = await createMobilePaymentIntent(
      booking.total_price,
      booking_id,
      customer.id,
      {
        tour_title: booking.tour_title,
        user_email: user.email,
      }
    );

    let checkout;
    if (existingCheckout) {
      await Checkout.updateStatus(
        existingCheckout.checkout_id,
        'pending',
        paymentIntent.id
      );
      checkout = await Checkout.findById(existingCheckout.checkout_id);
    } else {
      const checkoutData = {
        booking_id,
        payment_method: 'stripe_mobile',
        amount: booking.total_price,
        payment_status: 'pending',
        transaction_id: paymentIntent.id,
      };
      checkout = await Checkout.create(checkoutData);
    }

    logger.info(
      `Created mobile Stripe payment for booking ${booking_id}, checkout ID: ${checkout.checkout_id}, payment intent: ${paymentIntent.id}`
    );

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customerId: customer.id,
      checkout_id: checkout.checkout_id,
      amount: booking.total_price,
    });
  } catch (error) {
    logger.error(`Error creating mobile payment: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const confirmMobilePayment = async (req, res) => {
  try {
    const { payment_intent_id } = req.body;
    const user_id = req.user.id;

    if (!payment_intent_id) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }

    const paymentIntent = await retrievePaymentIntent(payment_intent_id);

    if (!paymentIntent) {
      return res.status(404).json({ message: 'Payment intent not found' });
    }

    const checkout = await Checkout.findByTransactionId(payment_intent_id);
    if (!checkout) {
      return res.status(404).json({ message: 'Checkout record not found' });
    }

    const booking = await Booking.findById(checkout.booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id !== user_id) {
      return res
        .status(403)
        .json({ message: 'Unauthorized access to booking' });
    }

    if (checkout.payment_status === 'completed') {
      return res.status(200).json({
        message: 'Payment already confirmed',
        payment_status: 'completed',
        booking_status: booking.booking_status,
        booking_id: checkout.booking_id,
      });
    }

    if (paymentIntent.status === 'succeeded') {
      await Checkout.updateStatus(
        checkout.checkout_id,
        'completed',
        payment_intent_id
      );

      await Booking.updateStatus(checkout.booking_id, 'confirmed');

      const existingInvoice = await Invoice.findByBookingId(
        checkout.booking_id
      );

      if (!existingInvoice) {
        const invoiceData = {
          booking_id: checkout.booking_id,
          amount_due: checkout.amount,
          details: JSON.stringify({
            payment_method: 'stripe_mobile',
            transaction_id: payment_intent_id,
            payment_date: new Date().toISOString(),
            tour_title: booking.tour_title,
            departure_date: booking.start_date,
            num_adults: booking.num_adults,
            num_children_120_140: booking.num_children_120_140,
            num_children_100_120: booking.num_children_100_120,
            original_price: booking.original_price,
            discount: booking.discount,
            promotion_id: booking.promotion_id,
            contact_info: booking.contact_info,
            passengers: booking.passengers,
            order_notes: booking.order_notes,
          }),
        };

        const invoice = await Invoice.create(invoiceData);
        logger.info(
          `Created invoice ${invoice.invoice_id} for booking ${checkout.booking_id}`
        );
      }

      if (booking.user_id && booking.tour_id) {
        trackTourBooking(booking.user_id, booking.tour_id).catch((error) => {
          logger.error(`Error tracking tour booking: ${error.message}`);
        });
        
        // Send invoice by email
        sendInvoiceByEmail(checkout.booking_id, booking.user_id).catch(error => {
          logger.error(`Error sending invoice email: ${error.message}`);
        });
      }

      logger.info(
        `Mobile payment confirmed for booking ${checkout.booking_id}, payment intent: ${payment_intent_id}`
      );

      res.status(200).json({
        message: 'Payment confirmed successfully',
        payment_status: 'completed',
        booking_status: 'confirmed',
        booking_id: checkout.booking_id,
        checkout_id: checkout.checkout_id,
      });
    } else if (paymentIntent.status === 'requires_payment_method') {
      await Checkout.updateStatus(
        checkout.checkout_id,
        'failed',
        payment_intent_id
      );

      logger.warn(
        `Mobile payment requires payment method for booking ${checkout.booking_id}, payment intent: ${payment_intent_id}`
      );

      res.status(400).json({
        message: 'Payment requires a valid payment method',
        payment_status: paymentIntent.status,
        booking_id: checkout.booking_id,
      });
    } else if (paymentIntent.status === 'canceled') {
      await Checkout.updateStatus(
        checkout.checkout_id,
        'cancelled',
        payment_intent_id
      );

      logger.warn(
        `Mobile payment was canceled for booking ${checkout.booking_id}, payment intent: ${payment_intent_id}`
      );

      res.status(400).json({
        message: 'Payment was canceled',
        payment_status: paymentIntent.status,
        booking_id: checkout.booking_id,
      });
    } else {
      logger.warn(
        `Mobile payment not succeeded: ${paymentIntent.status} for booking ${checkout.booking_id}, payment intent: ${payment_intent_id}`
      );

      res.status(400).json({
        message: `Payment status: ${paymentIntent.status}`,
        payment_status: paymentIntent.status,
        booking_id: checkout.booking_id,
      });
    }
  } catch (error) {
    logger.error(`Error confirming mobile payment: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
