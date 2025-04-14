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
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

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

    logger.info(`Generated VNPay payment URL for booking: ${bookingId}, txnRef: ${txnRef}`);
    return { paymentUrl, txnRef };
  } catch (error) {
    logger.error(`Error generating VNPay payment URL: ${error.message}`);
    throw error;
  }
};

export const verifyReturnUrl = (queryParams) => {
  try {
    const verify = vnpay.verifyReturnUrl(queryParams);
    logger.info(`VNPay return URL verification: isVerified=${verify.isVerified}, isSuccess=${verify.isSuccess}`);
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
