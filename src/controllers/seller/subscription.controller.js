import dotenv from 'dotenv';
dotenv.config();

import SubscriptionPackage from '../../models/SubscriptionPackage.js';
import SellerSubscription from '../../models/SellerSubscription.js';
import SubscriptionInvoice from '../../models/SubscriptionInvoice.js';
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
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

// Helper function to process successful VNPay payments and create invoices
const handleSuccessfulVNPay = async (txnRef, amount) => {
  const subscriptionId = parseInt(txnRef.split('-')[0], 10);
  if (isNaN(subscriptionId)) {
    logger.error(`Could not parse subscriptionId from txnRef: ${txnRef}`);
    throw new Error('Invalid transaction reference');
  }

  const subscription = await SellerSubscription.findById(subscriptionId);
  if (!subscription) {
    logger.error(`Subscription not found for ID: ${subscriptionId}`);
    throw new Error('Subscription not found');
  }

  if (subscription.status === 'active') {
    logger.info(`Subscription ${subscriptionId} is already active.`);
    return { success: true, subscription };
  }

  if (parseFloat(subscription.price) !== parseFloat(amount)) {
    logger.error(
      `Amount mismatch for transaction ${txnRef}: expected ${subscription.price}, got ${amount}`
    );
    throw new Error('Amount mismatch');
  }

  const existingInvoice =
    await SubscriptionInvoice.findBySubscriptionId(subscriptionId);
  if (!existingInvoice) {
    const invoiceData = {
      subscription_id: subscriptionId,
      amount_due: subscription.price,
      transaction_id: txnRef,
      details: JSON.stringify({
        payment_method: 'vnpay',
        package_name: subscription.package_name,
        duration_days: subscription.duration_days,
        purchase_date: subscription.purchase_date.toISOString(),
        payment_date: new Date().toISOString(),
      }),
    };
    await SubscriptionInvoice.create(invoiceData);
    logger.info(
      `Created invoice for successful VNPay payment, subscription: ${subscriptionId}`
    );
  }

  await SellerSubscription.updateStatus(subscriptionId, 'active');
  return { success: true, subscription };
};

export const getSubscriptionPackages = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const filters = {
      status: req.query.status || 'active',
    };

    const { packages, totalItems } = await SubscriptionPackage.findAll(
      filters,
      limit,
      offset
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${packages.length} subscription packages (page ${page})`
    );

    res.status(200).json({
      packages,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting subscription packages: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSubscriptionPackageById = async (req, res) => {
  try {
    const packageId = req.params.id;
    const subscriptionPackage = await SubscriptionPackage.findById(packageId);

    if (!subscriptionPackage) {
      return res
        .status(404)
        .json({ message: 'Subscription package not found' });
    }

    res.status(200).json(subscriptionPackage);
  } catch (error) {
    logger.error(`Error getting subscription package: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSellerSubscriptions = async (req, res) => {
  try {
    const sellerId = req.userId;
    const { page, limit, offset } = getPaginationParams(req.query);

    const { subscriptions, totalItems } =
      await SellerSubscription.findBySellerId(sellerId, limit, offset);

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${subscriptions.length} subscriptions for seller ${sellerId} (page ${page})`
    );

    res.status(200).json({
      subscriptions,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting seller subscriptions: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getActiveSubscription = async (req, res) => {
  try {
    const sellerId = req.userId;
    const { page, limit, offset } = getPaginationParams(req.query);

    const { subscriptions, totalItems } =
      await SellerSubscription.findActiveSubscriptionBySellerId(sellerId, limit, offset);

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({
        message: 'No active subscription found',
        hasActiveSubscription: false,
      });
    }

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${subscriptions.length} active subscriptions for seller ${sellerId} (page ${page})`
    );

    res.status(200).json({
      subscriptions,
      hasActiveSubscription: true,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting active subscription: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createSubscriptionPayment = async (req, res) => {
  try {
    const { package_id, payment_method = 'vnpay' } = req.body;
    const seller_id = req.userId;

    if (!package_id) {
      return res.status(400).json({ message: 'Package ID is required' });
    }

    if (payment_method !== 'vnpay' && payment_method !== 'stripe') {
      return res.status(400).json({
        message: 'Invalid payment method. Use vnpay or stripe',
      });
    }

    const subscriptionPackage = await SubscriptionPackage.findById(package_id);
    if (!subscriptionPackage) {
      return res
        .status(404)
        .json({ message: 'Subscription package not found' });
    }

    if (subscriptionPackage.status !== 'active') {
      return res
        .status(400)
        .json({ message: 'This subscription package is not available' });
    }

    const { subscriptions } =
      await SellerSubscription.findActiveSubscriptionBySellerId(seller_id);

    let expiryDate;
    if (subscriptions && subscriptions.length > 0) {
      const mostRecentSubscription = subscriptions[0];
      expiryDate = new Date(mostRecentSubscription.expiry_date);
      expiryDate.setDate(
        expiryDate.getDate() + subscriptionPackage.duration_days
      );
      logger.info(
        `Extending subscription from existing expiry date: ${mostRecentSubscription.expiry_date} to ${expiryDate}`
      );
    } else {
      expiryDate = new Date();
      expiryDate.setDate(
        expiryDate.getDate() + subscriptionPackage.duration_days
      );
    }

    const subscriptionData = {
      seller_id,
      package_id,
      expiry_date: expiryDate,
      status: 'pending',
      payment_method,
    };

    const subscription = await SellerSubscription.create(subscriptionData);

    if (payment_method === 'stripe') {
      const orderInfo = `Payment for subscription package: ${subscriptionPackage.package_name}`;
      const session = await createStripeCheckoutSession(
        subscriptionPackage.price,
        subscription.subscription_id,
        orderInfo,
        `${process.env.SELLER_URL}/subscription/success?payment_method=stripe&subscription_id=${subscription.subscription_id}`,
        `${process.env.SELLER_URL}/subscription/failed?payment_method=stripe&reason=cancelled&subscription_id=${subscription.subscription_id}`,
        true
      );

      logger.info(
        `Created Stripe payment for subscription ${subscription.subscription_id}, session id: ${session.id}`
      );

      return res.status(200).json({
        message: 'Stripe payment initiated',
        paymentUrl: session.url,
        subscription_id: subscription.subscription_id,
        transaction_id: session.id,
      });
    }

    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const orderInfo = `Payment for subscription package: ${subscriptionPackage.package_name}`;
    const { paymentUrl, txnRef } = generatePaymentUrl(
      subscriptionPackage.price,
      subscription.subscription_id,
      orderInfo,
      ipAddr,
      `${process.env.SERVER_URL}/api/seller/subscriptions/vnpay-return`
    );

    logger.info(
      `Created VNPay payment for subscription ${subscription.subscription_id}`
    );

    res.status(200).json({
      message: 'Payment initiated',
      paymentUrl,
      subscription_id: subscription.subscription_id,
      transaction_id: txnRef,
    });
  } catch (error) {
    logger.error(`Error creating subscription payment: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const vnpayReturn = async (req, res) => {
  try {
    const verify = verifyReturnUrl(req.query);

    if (!verify.isVerified) {
      logger.warn(
        `VNPay return verification failed: ${JSON.stringify(req.query)}`
      );
      return res.redirect(
        `${process.env.SELLER_URL}/subscription/failed?payment_method=vnpay&reason=verification_failed`
      );
    }

    if (!verify.isSuccess) {
      logger.warn(`VNPay payment failed: ${JSON.stringify(req.query)}`);
      return res.redirect(
        `${process.env.SELLER_URL}/subscription/failed?payment_method=vnpay&reason=payment_failed`
      );
    }

    const txnRef = req.query.vnp_TxnRef;
    const amount = req.query.vnp_Amount / 100;

    const { subscription } = await handleSuccessfulVNPay(txnRef, amount);

    logger.info(
      `Payment successful for subscription ${subscription.subscription_id}, transaction: ${txnRef}`
    );

    return res.redirect(
      `${process.env.SELLER_URL}/subscription/success?payment_method=vnpay&subscription_id=${subscription.subscription_id}`
    );
  } catch (error) {
    logger.error(`Error processing VNPay return: ${error.message}`);
    return res.redirect(
      `${process.env.SELLER_URL}/subscription/failed?payment_method=vnpay&reason=server_error`
    );
  }
};

export const vnpayIPN = async (req, res) => {
  try {
    const verify = verifyIpnCall(req.query);

    if (!verify.isVerified) {
      logger.warn(
        `VNPay IPN verification failed: ${JSON.stringify(req.query)}`
      );
      return res.status(200).json(getIpnResponse(false));
    }

    const txnRef = req.query.vnp_TxnRef;
    const amount = req.query.vnp_Amount / 100;
    const responseCode = req.query.vnp_ResponseCode;

    if (responseCode !== '00') {
        logger.warn(`VNPay IPN received a failed payment status: ${responseCode}`);
        return res.status(200).json(getErrorResponse());
    }

    await handleSuccessfulVNPay(txnRef, amount);

    logger.info(
      `IPN confirmed payment for subscription, transaction: ${txnRef}`
    );

    return res.status(200).json(getIpnResponse(true));
  } catch (error) {
    logger.error(`Error processing VNPay IPN: ${error.message}`);
    return res.status(200).json(getErrorResponse());
  }
};

export const getSubscriptionInvoices = async (req, res) => {
  try {
    const sellerId = req.userId;
    const { page, limit, offset } = getPaginationParams(req.query);

    const { invoices, totalItems } = await SubscriptionInvoice.findBySellerId(
      sellerId,
      limit,
      offset
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Retrieved ${invoices.length} subscription invoices for seller ${sellerId} (page ${page})`
    );

    res.status(200).json({
      invoices,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting subscription invoices: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    if (!Buffer.isBuffer(req.body)) {
      logger.error('Request body is not a Buffer as expected');
      return res.status(400).json({
        error: 'Invalid request body format',
        tip: 'Make sure express.raw() middleware is properly configured',
      });
    }

    const event = constructStripeEvent(
      req.body,
      signature,
      process.env.STRIPE_SELLER_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.metadata.subscription_id) {
        const subscriptionId = session.metadata.subscription_id;
        const transactionId = session.id;
        const amountPaid = session.amount_total / 100;

        logger.info(
          `Stripe checkout session completed for subscription ${subscriptionId}, session id: ${transactionId}`
        );
        
        const subscription = await SellerSubscription.findById(subscriptionId);
        if (!subscription) {
            logger.error(`Subscription not found for ID: ${subscriptionId}`);
            return res.status(400).json({ error: 'Subscription not found' });
        }

        if (subscription.status === 'active') {
            logger.info(`Subscription ${subscriptionId} is already active.`);
            return res.status(200).json({ received: true });
        }
        
        const existingInvoice = await SubscriptionInvoice.findBySubscriptionId(subscriptionId);
        if (!existingInvoice) {
            const invoiceData = {
              subscription_id: subscriptionId,
              amount_due: amountPaid,
              transaction_id: transactionId,
              details: JSON.stringify({
                payment_method: 'stripe',
                package_name: subscription.package_name,
                duration_days: subscription.duration_days,
                purchase_date: subscription.purchase_date.toISOString(),
                payment_date: new Date().toISOString(),
              }),
            };
            await SubscriptionInvoice.create(invoiceData);
            logger.info(`Created invoice for successful Stripe payment, subscription: ${subscriptionId}`);
        }

        await SellerSubscription.updateStatus(subscriptionId, 'active');

        logger.info(
          `Webhook confirmed Stripe payment for subscription ${subscriptionId}`
        );
      } else {
        logger.warn(
          `Stripe checkout session completed but no subscription_id found in metadata: ${session.id}`
        );
      }
    } else if (
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      const object = event.data.object;
      const objectId = object.id;

      if (object.metadata.subscription_id) {
        const subscriptionId = object.metadata.subscription_id;

        logger.warn(
          `Stripe payment failed for subscription ${subscriptionId}, id: ${objectId}`
        );
        
        const subscription = await SellerSubscription.findById(subscriptionId);
        if (subscription && subscription.status === 'pending') {
          await SellerSubscription.updateStatus(
            subscriptionId,
            'failed'
          );
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error processing Stripe webhook: ${error.message}`);
    logger.error(`Stripe webhook error details: ${error.stack}`);
    logger.error(`Stripe webhook headers: ${JSON.stringify(req.headers)}`);
    res.status(400).json({
      error: error.message,
      tip: "Make sure you're using the correct webhook secret and sending the raw request body",
    });
  }
};