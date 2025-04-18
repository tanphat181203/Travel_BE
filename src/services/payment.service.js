import {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
  IpnFailChecksum,
  IpnUnknownError,
  IpnSuccess,
} from 'vnpay';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMNCODE,
  secureSecret: process.env.VNPAY_SECURE_SECRET,
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512',
  enableLog: true,
  loggerFn: ignoreLogger,
});

export const generatePaymentUrl = (amount, bookingId, orderInfo, ipAddr) => {
  try {
    const txnRef = `${bookingId}-${Date.now()}`;

    // const tomorrow = new Date();
    // tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr || '127.0.0.1',
      vnp_TxnRef: txnRef, // Unique transaction reference
      vnp_OrderInfo: orderInfo || `Payment for booking #${bookingId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${process.env.SERVER_URL}/api/user/payments/vnpay-return`,
      vnp_Locale: VnpLocale.VN,
      // vnp_CreateDate: dateFormat(new Date()),
      // vnp_ExpireDate: dateFormat(tomorrow),
    });

    logger.info(
      `Generated VNPay payment URL for booking: ${bookingId}, txnRef: ${txnRef}`
    );
    return { paymentUrl, txnRef };
  } catch (error) {
    logger.error(`Error generating VNPay payment URL: ${error.message}`);
    throw error;
  }
};

export const verifyReturnUrl = (queryParams) => {
  try {
    const verify = vnpay.verifyReturnUrl(queryParams);
    logger.info(
      `VNPay return URL verification: isVerified=${verify.isVerified}, isSuccess=${verify.isSuccess}`
    );
    return verify;
  } catch (error) {
    logger.error(`Error verifying VNPay return URL: ${error.message}`);
    throw error;
  }
};

export const verifyIpnCall = (queryParams) => {
  try {
    const verify = vnpay.verifyIpnCall(queryParams);
    logger.info(`VNPay IPN verification: isVerified=${verify.isVerified}`);
    return verify;
  } catch (error) {
    logger.error(`Error verifying VNPay IPN call: ${error.message}`);
    throw error;
  }
};

export const getIpnResponse = (isSuccess) => {
  if (!isSuccess) {
    return IpnFailChecksum;
  }
  return IpnSuccess;
};

export const getErrorResponse = () => {
  return IpnUnknownError;
};

export const createStripePaymentIntent = async (
  amount,
  bookingId,
  metadata = {}
) => {
  try {
    const amountInVND = Math.round(amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInVND,
      currency: 'vnd',
      metadata: {
        booking_id: bookingId,
        ...metadata,
      },
    });

    logger.info(
      `Created Stripe payment intent for booking: ${bookingId}, id: ${paymentIntent.id}`
    );
    return paymentIntent;
  } catch (error) {
    logger.error(`Error creating Stripe payment intent: ${error.message}`);
    throw error;
  }
};

export const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    logger.info(`Retrieved Stripe payment intent: ${paymentIntentId}`);
    return paymentIntent;
  } catch (error) {
    logger.error(`Error retrieving Stripe payment intent: ${error.message}`);
    throw error;
  }
};

export const constructStripeEvent = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    logger.info(`Constructed Stripe webhook event: ${event.type}`);
    return event;
  } catch (error) {
    logger.error(`Error constructing Stripe webhook event: ${error.message}`);
    throw error;
  }
};

export const createStripeCheckoutSession = async (
  amount,
  bookingId,
  orderInfo,
  successUrl,
  cancelUrl
) => {
  try {
    const amountInVND = Math.round(amount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'vnd',
            product_data: {
              name: orderInfo || `Booking #${bookingId}`,
              description: `Payment for booking #${bookingId}`,
            },
            unit_amount: amountInVND,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url:
        successUrl ||
        `${process.env.CLIENT_URL}/payment/success?payment_method=stripe&booking_id=${bookingId}`,
      cancel_url:
        cancelUrl ||
        `${process.env.CLIENT_URL}/payment/failed?payment_method=stripe&reason=cancelled&booking_id=${bookingId}`,
      metadata: {
        booking_id: bookingId,
      },
    });

    logger.info(
      `Created Stripe checkout session for booking: ${bookingId}, session id: ${session.id}`
    );
    return session;
  } catch (error) {
    logger.error(`Error creating Stripe checkout session: ${error.message}`);
    throw error;
  }
};
