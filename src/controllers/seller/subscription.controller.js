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
    const subscription =
      await SellerSubscription.findActiveSubscriptionBySellerId(sellerId);

    if (!subscription) {
      return res.status(404).json({
        message: 'No active subscription found',
        hasActiveSubscription: false,
      });
    }

    res.status(200).json({
      subscription,
      hasActiveSubscription: true,
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

    // Check if the package exists
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

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(
      expiryDate.getDate() + subscriptionPackage.duration_days
    );

    // Create subscription record
    const subscriptionData = {
      seller_id,
      package_id,
      expiry_date: expiryDate,
      status: 'pending',
      payment_method,
    };

    const subscription = await SellerSubscription.create(subscriptionData);

    // Create invoice record
    const invoiceData = {
      subscription_id: subscription.subscription_id,
      amount_due: subscriptionPackage.price,
      details: JSON.stringify({
        payment_method,
        package_name: subscriptionPackage.package_name,
        duration_days: subscriptionPackage.duration_days,
        purchase_date: new Date().toISOString(),
      }),
    };

    const invoice = await SubscriptionInvoice.create(invoiceData);

    // Handle Stripe payment
    if (payment_method === 'stripe') {
      // Create a checkout session with Stripe to get a payment URL
      const orderInfo = `Payment for subscription package: ${subscriptionPackage.package_name}`;
      const session = await createStripeCheckoutSession(
        subscriptionPackage.price,
        subscription.subscription_id,
        orderInfo,
        `${process.env.CLIENT_URL}/seller/subscription/success?payment_method=stripe&subscription_id=${subscription.subscription_id}`,
        `${process.env.CLIENT_URL}/seller/subscription/failed?payment_method=stripe&reason=cancelled&subscription_id=${subscription.subscription_id}`,
        true // Set isSubscription to true
      );

      // Update invoice with transaction ID
      await SubscriptionInvoice.updateTransactionId(
        invoice.invoice_id,
        session.id
      );

      logger.info(
        `Created Stripe payment for subscription ${subscription.subscription_id}, invoice ID: ${invoice.invoice_id}, session id: ${session.id}`
      );

      return res.status(200).json({
        message: 'Stripe payment initiated',
        paymentUrl: session.url,
        subscription_id: subscription.subscription_id,
        invoice_id: invoice.invoice_id,
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
    const orderInfo = `Payment for subscription package: ${subscriptionPackage.package_name}`;
    const { paymentUrl, txnRef } = generatePaymentUrl(
      subscriptionPackage.price,
      subscription.subscription_id,
      orderInfo,
      ipAddr,
      `${process.env.SERVER_URL}/api/seller/subscriptions/vnpay-return`
    );

    // Update invoice with transaction ID
    await SubscriptionInvoice.updateTransactionId(invoice.invoice_id, txnRef);

    logger.info(
      `Created VNPay payment for subscription ${subscription.subscription_id}, invoice ID: ${invoice.invoice_id}`
    );

    res.status(200).json({
      message: 'Payment initiated',
      paymentUrl,
      subscription_id: subscription.subscription_id,
      invoice_id: invoice.invoice_id,
      transaction_id: txnRef,
    });
  } catch (error) {
    logger.error(`Error creating subscription payment: ${error.message}`);
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
        `${process.env.CLIENT_URL}/seller/subscription/failed?payment_method=vnpay&reason=verification_failed`
      );
    }

    if (!verify.isSuccess) {
      logger.warn(`VNPay payment failed: ${JSON.stringify(req.query)}`);
      return res.redirect(
        `${process.env.CLIENT_URL}/seller/subscription/failed?payment_method=vnpay&reason=payment_failed`
      );
    }

    // Extract transaction reference and amount
    const txnRef = req.query.vnp_TxnRef;
    const amount = req.query.vnp_Amount / 100; // VNPay amount is in VND * 100

    // Find the invoice by transaction ID
    const invoice = await SubscriptionInvoice.findByTransactionId(txnRef);
    if (!invoice) {
      logger.error(`Invoice not found for transaction: ${txnRef}`);
      return res.redirect(
        `${process.env.CLIENT_URL}/seller/subscription/failed?payment_method=vnpay&reason=invoice_not_found`
      );
    }

    // Verify amount
    if (parseFloat(invoice.amount_due) !== parseFloat(amount)) {
      logger.error(
        `Amount mismatch for transaction ${txnRef}: expected ${invoice.amount_due}, got ${amount}`
      );
      return res.redirect(
        `${process.env.CLIENT_URL}/seller/subscription/failed?payment_method=vnpay&reason=amount_mismatch`
      );
    }

    // Update subscription status
    await SellerSubscription.updateStatus(
      invoice.subscription_id,
      'active',
      txnRef
    );

    // Update invoice details
    let updatedDetails;
    if (typeof invoice.details === 'string') {
      updatedDetails = JSON.parse(invoice.details || '{}');
    } else {
      updatedDetails = invoice.details || {};
    }
    updatedDetails.payment_date = new Date().toISOString();
    updatedDetails.transaction_id = txnRef;

    await SubscriptionInvoice.updateTransactionId(invoice.invoice_id, txnRef);

    logger.info(
      `Payment successful for subscription ${invoice.subscription_id}, transaction: ${txnRef}`
    );

    return res.redirect(
      `${process.env.CLIENT_URL}/seller/subscription/success?payment_method=vnpay&subscription_id=${invoice.subscription_id}`
    );
  } catch (error) {
    logger.error(`Error processing VNPay return: ${error.message}`);
    return res.redirect(
      `${process.env.CLIENT_URL}/seller/subscription/failed?payment_method=vnpay&reason=server_error`
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

    // Find the invoice by transaction ID
    const invoice = await SubscriptionInvoice.findByTransactionId(txnRef);
    if (!invoice) {
      logger.error(`Invoice not found for transaction: ${txnRef}`);
      return res.status(200).json(getErrorResponse());
    }

    // Verify amount
    if (parseFloat(invoice.amount_due) !== parseFloat(amount)) {
      logger.error(
        `Amount mismatch for transaction ${txnRef}: expected ${invoice.amount_due}, got ${amount}`
      );
      return res.status(200).json(getErrorResponse());
    }

    // Update subscription status
    await SellerSubscription.updateStatus(
      invoice.subscription_id,
      'active',
      txnRef
    );

    // Update invoice details
    let updatedDetails;
    if (typeof invoice.details === 'string') {
      updatedDetails = JSON.parse(invoice.details || '{}');
    } else {
      updatedDetails = invoice.details || {};
    }
    updatedDetails.payment_date = new Date().toISOString();
    updatedDetails.transaction_id = txnRef;

    await SubscriptionInvoice.updateTransactionId(invoice.invoice_id, txnRef);

    logger.info(
      `IPN confirmed payment for subscription ${invoice.subscription_id}, transaction: ${txnRef}`
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
    // Log the raw request body for debugging
    logger.info(`Processing Stripe webhook with signature: ${signature}`);

    // Ensure we have a raw body buffer
    if (!Buffer.isBuffer(req.body)) {
      logger.error('Request body is not a Buffer as expected');
      return res.status(400).json({
        error: 'Invalid request body format',
        tip: 'Make sure express.raw() middleware is properly configured',
      });
    }

    // For Stripe webhooks, req.body is a raw buffer that we need to pass directly to the constructStripeEvent function for signature verification
    const event = constructStripeEvent(
      req.body,
      signature,
      process.env.STRIPE_SELLER_WEBHOOK_SECRET
    );

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

        // Update invoice details if needed
        let updatedDetails;
        if (typeof invoice.details === 'string') {
          updatedDetails = JSON.parse(invoice.details || '{}');
        } else {
          updatedDetails = invoice.details || {};
        }
        updatedDetails.payment_date = new Date().toISOString();
        updatedDetails.transaction_id = session.id;

        logger.info(
          `Webhook confirmed Stripe payment for subscription ${invoice.subscription_id}`
        );
      } else {
        logger.warn(
          `Stripe checkout session completed but no subscription_id found in metadata: ${session.id}`
        );
      }
    }
    // Handle payment_intent events for backward compatibility
    else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Check if this is a subscription payment
      if (paymentIntent.metadata.subscription_id) {
        const subscriptionId = paymentIntent.metadata.subscription_id;

        logger.info(
          `Stripe payment intent succeeded for subscription ${subscriptionId}, payment intent: ${paymentIntent.id}`
        );

        // Find the subscription invoice by transaction ID
        const invoice = await SubscriptionInvoice.findByTransactionId(
          paymentIntent.id
        );
        if (invoice) {
          // Update subscription status
          await SellerSubscription.updateStatus(
            invoice.subscription_id,
            'active',
            paymentIntent.id
          );

          logger.info(
            `Webhook confirmed Stripe payment for subscription ${invoice.subscription_id}`
          );
        }
      }
    }
    // Handle payment failures and session expirations
    else if (
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
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
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error processing Stripe webhook: ${error.message}`);
    logger.error(`Stripe webhook error details: ${error.stack}`);

    // Log additional information about the request
    logger.error(`Stripe webhook headers: ${JSON.stringify(req.headers)}`);

    res.status(400).json({
      error: error.message,
      tip: "Make sure you're using the correct webhook secret and sending the raw request body",
    });
  }
};
