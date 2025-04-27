import Tour from '../../models/Tour.js';
import Booking from '../../models/Booking.js';
import logger from '../../utils/logger.js';

export const getDashboardStats = async (req, res) => {
  try {
    const sellerId = req.userId;
    
    const subscriptionStatus = {
      hasActiveSubscription: req.hasActiveSubscription || false
    };
    
    if (req.subscription) {
      subscriptionStatus.subscription = {
        package_name: req.subscription.package_name,
        expiry_date: req.subscription.expiry_date,
        status: req.subscription.status
      };
    }
    
    if (!req.hasActiveSubscription) {
      return res.status(200).json({
        ...subscriptionStatus,
        message: 'Please purchase a subscription to access full dashboard features'
      });
    }

    const tourStats = await Tour.getStatsBySellerId(sellerId);
    
    const bookingStats = await Booking.getStatsBySellerId(sellerId);
    
    const recentBookings = await Booking.getRecentBySellerId(sellerId, 5);
    
    res.status(200).json({
      ...subscriptionStatus,
      tourStats,
      bookingStats,
      recentBookings
    });
  } catch (error) {
    logger.error(`Error getting dashboard stats: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const sellerId = req.userId;

    const subscriptionStatus = {
      hasActiveSubscription: req.hasActiveSubscription || false
    };
    
    if (req.subscription) {
      subscriptionStatus.subscription = {
        subscription_id: req.subscription.subscription_id,
        package_id: req.subscription.package_id,
        package_name: req.subscription.package_name,
        purchase_date: req.subscription.purchase_date,
        expiry_date: req.subscription.expiry_date,
        status: req.subscription.status,
        price: req.subscription.price,
        duration_days: req.subscription.duration_days
      };
    }
    
    res.status(200).json(subscriptionStatus);
  } catch (error) {
    logger.error(`Error getting subscription status: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
