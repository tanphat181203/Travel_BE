import Promotion from '../../models/Promotion.js';
import Tour from '../../models/Tour.js';
import logger from '../../utils/logger.js';

export const getActivePromotionsForTour = async (req, res, next) => {
  try {
    const { tourId } = req.params;

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    const currentDate = new Date();
    const promotions = await Promotion.getActivePromotionsForTour(
      tourId,
      currentDate
    );

    return res.status(200).json({ promotions });
  } catch (error) {
    logger.error(`Error getting active promotions for tour: ${error.message}`);
    next(error);
  }
};

export const calculateDiscountForTour = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const { price, promotion_id } = req.query;

    if (!price || isNaN(parseFloat(price))) {
      return res
        .status(400)
        .json({ message: 'Valid price parameter is required' });
    }

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    const priceValue = parseFloat(price);

    if (!promotion_id) {
      return res.status(200).json({
        originalPrice: priceValue,
        discountedPrice: priceValue,
        discount: 0,
        appliedPromotion: null,
      });
    }

    const priceDetails = await Promotion.calculateDiscount(
      tourId,
      priceValue,
      parseInt(promotion_id)
    );

    return res.status(200).json({
      originalPrice: priceDetails.originalPrice,
      discountedPrice: priceDetails.discountedPrice,
      discount: priceDetails.discount,
      appliedPromotion: priceDetails.appliedPromotion
        ? {
            promotion_id: priceDetails.appliedPromotion.promotion_id,
            name: priceDetails.appliedPromotion.name,
            type: priceDetails.appliedPromotion.type,
            discount: priceDetails.appliedPromotion.discount,
          }
        : null,
    });
  } catch (error) {
    logger.error(`Error calculating discount for tour: ${error.message}`);
    next(error);
  }
};
