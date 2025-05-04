import Promotion from '../../models/Promotion.js';
import { checkTourOwnership } from '../../utils/tourHelper.js';
import logger from '../../utils/logger.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const createPromotion = async (req, res, next) => {
  try {
    const sellerId = req.userId;
    const {
      name,
      description,
      type,
      discount,
      start_date,
      end_date,
      status = 'active',
    } = req.body;

    if (!name || !description || !discount || !start_date || !end_date) {
      return res.status(400).json({
        message:
          'Missing required fields: name, description, discount, start_date, end_date',
      });
    }

    if (type === 'percent' && (discount <= 0 || discount > 100)) {
      return res.status(400).json({
        message: 'Percent discount must be between 0 and 100',
      });
    }

    if (type === 'fixed' && discount <= 0) {
      return res.status(400).json({
        message: 'Fixed discount must be greater than 0',
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        message: 'End date must be after start date',
      });
    }

    const promotionData = {
      seller_id: sellerId,
      name,
      description,
      type: type || 'percent',
      discount,
      start_date,
      end_date,
      status,
    };

    const newPromotion = await Promotion.create(promotionData);

    logger.info(`Promotion created: promotionId=${newPromotion.promotion_id}`);
    return res.status(201).json(newPromotion);
  } catch (error) {
    logger.error(`Error creating promotion: ${error.message}`);
    next(error);
  }
};

export const getPromotions = async (req, res, next) => {
  try {
    const sellerId = req.userId;
    const { page, limit, offset } = getPaginationParams(req.query);

    const params = {
      seller_id: sellerId,
      status: req.query.status,
      current_date: req.query.active_only === 'true' ? new Date() : null,
    };

    const { promotions, totalItems } = await Promotion.findAll(
      params,
      limit,
      offset
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    return res.status(200).json({
      promotions,
      pagination,
    });
  } catch (error) {
    logger.error(`Error getting promotions: ${error.message}`);
    next(error);
  }
};

export const getPromotionById = async (req, res, next) => {
  try {
    const promotionId = req.params.id;
    const sellerId = req.userId;

    const ownershipCheck = await Promotion.checkOwnership(
      promotionId,
      sellerId
    );
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    return res.status(200).json(promotion);
  } catch (error) {
    logger.error(`Error getting promotion by ID: ${error.message}`);
    next(error);
  }
};

export const updatePromotion = async (req, res, next) => {
  try {
    const promotionId = req.params.id;
    const sellerId = req.userId;

    const ownershipCheck = await Promotion.checkOwnership(
      promotionId,
      sellerId
    );
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    // Check if the promotion is in use
    // Note: This validation is intentionally only done in the controller to provide
    // user-friendly error messages and maintain consistent HTTP status codes
    const usageCheck = await Promotion.isPromotionInUse(promotionId);
    if (usageCheck.inUse) {
      if (req.body.discount !== undefined || req.body.type !== undefined) {
        let message =
          'Cannot modify discount or type of a promotion that is currently in use.';
        if (usageCheck.reason === 'promotion_applied_to_tour') {
          message += ' This promotion is applied to one or more tours.';
        } else if (usageCheck.reason === 'promotion_used_in_booking') {
          message += ' This promotion is used in one or more active bookings.';
        }
        return res.status(400).json({ message });
      }
    }

    if (req.body.start_date && req.body.end_date) {
      const startDate = new Date(req.body.start_date);
      const endDate = new Date(req.body.end_date);

      if (endDate < startDate) {
        return res.status(400).json({
          message: 'End date must be after start date',
        });
      }
    } else if (req.body.start_date) {
      const promotion = await Promotion.findById(promotionId);
      const startDate = new Date(req.body.start_date);
      const endDate = new Date(promotion.end_date);

      if (endDate < startDate) {
        return res.status(400).json({
          message: 'End date must be after start date',
        });
      }
    } else if (req.body.end_date) {
      const promotion = await Promotion.findById(promotionId);
      const startDate = new Date(promotion.start_date);
      const endDate = new Date(req.body.end_date);

      if (endDate < startDate) {
        return res.status(400).json({
          message: 'End date must be after start date',
        });
      }
    }

    if (req.body.discount) {
      const type =
        req.body.type || (await Promotion.findById(promotionId)).type;

      if (
        type === 'percent' &&
        (req.body.discount <= 0 || req.body.discount > 100)
      ) {
        return res.status(400).json({
          message: 'Percent discount must be between 0 and 100',
        });
      }

      if (type === 'fixed' && req.body.discount <= 0) {
        return res.status(400).json({
          message: 'Fixed discount must be greater than 0',
        });
      }
    }

    const updatedPromotion = await Promotion.update(promotionId, req.body);
    if (!updatedPromotion) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    logger.info(`Promotion updated: promotionId=${promotionId}`);
    return res.status(200).json(updatedPromotion);
  } catch (error) {
    logger.error(`Error updating promotion: ${error.message}`);
    next(error);
  }
};

export const deletePromotion = async (req, res, next) => {
  try {
    const promotionId = req.params.id;
    const sellerId = req.userId;

    const ownershipCheck = await Promotion.checkOwnership(
      promotionId,
      sellerId
    );
    if (!ownershipCheck.success) {
      return res
        .status(ownershipCheck.status)
        .json({ message: ownershipCheck.message });
    }

    // Check if the promotion is in use
    // Note: This validation is intentionally only done in the controller to provide
    // user-friendly error messages and maintain consistent HTTP status codes
    const usageCheck = await Promotion.isPromotionInUse(promotionId);
    if (usageCheck.inUse) {
      let message = 'Cannot delete a promotion that is currently in use.';
      if (usageCheck.reason === 'promotion_applied_to_tour') {
        message +=
          ' This promotion is applied to one or more tours. Please remove it from all tours first.';
      } else if (usageCheck.reason === 'promotion_used_in_booking') {
        message += ' This promotion is used in one or more active bookings.';
      }
      return res.status(400).json({ message });
    }

    await Promotion.delete(promotionId);

    logger.info(`Promotion deleted: promotionId=${promotionId}`);
    return res.status(200).json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting promotion: ${error.message}`);
    next(error);
  }
};

export const applyPromotionToTour = async (req, res, next) => {
  try {
    const { promotionId, tourId } = req.params;
    const sellerId = req.userId;

    const promotionCheck = await Promotion.checkOwnership(
      promotionId,
      sellerId
    );
    if (!promotionCheck.success) {
      return res
        .status(promotionCheck.status)
        .json({ message: promotionCheck.message });
    }

    const tourCheck = await checkTourOwnership(tourId, sellerId);
    if (!tourCheck.success) {
      return res.status(tourCheck.status).json({ message: tourCheck.message });
    }

    await Promotion.applyToTour(promotionId, tourId);

    logger.info(`Promotion ${promotionId} applied to tour ${tourId}`);
    return res
      .status(200)
      .json({ message: 'Promotion applied to tour successfully' });
  } catch (error) {
    logger.error(`Error applying promotion to tour: ${error.message}`);
    next(error);
  }
};

export const removePromotionFromTour = async (req, res, next) => {
  try {
    const { promotionId, tourId } = req.params;
    const sellerId = req.userId;

    const promotionCheck = await Promotion.checkOwnership(
      promotionId,
      sellerId
    );
    if (!promotionCheck.success) {
      return res
        .status(promotionCheck.status)
        .json({ message: promotionCheck.message });
    }

    const tourCheck = await checkTourOwnership(tourId, sellerId);
    if (!tourCheck.success) {
      return res.status(tourCheck.status).json({ message: tourCheck.message });
    }

    const removeResult = await Promotion.removeFromTour(promotionId, tourId);
    if (!removeResult.success) {
      return res.status(404).json({ message: removeResult.message });
    }

    logger.info(`Promotion ${promotionId} removed from tour ${tourId}`);
    return res
      .status(200)
      .json({ message: 'Promotion removed from tour successfully' });
  } catch (error) {
    logger.error(`Error removing promotion from tour: ${error.message}`);
    next(error);
  }
};

export const getPromotionsForTour = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const sellerId = req.userId;

    const tourCheck = await checkTourOwnership(tourId, sellerId);
    if (!tourCheck.success) {
      return res.status(tourCheck.status).json({ message: tourCheck.message });
    }

    const promotions = await Promotion.findByTourId(tourId);

    return res.status(200).json({ promotions });
  } catch (error) {
    logger.error(`Error getting promotions for tour: ${error.message}`);
    next(error);
  }
};

export const getActivePromotionsForTour = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const sellerId = req.userId;

    const tourCheck = await checkTourOwnership(tourId, sellerId);
    if (!tourCheck.success) {
      return res.status(tourCheck.status).json({ message: tourCheck.message });
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

export const applyPromotionToMultipleTours = async (req, res, next) => {
  try {
    const { promotionId } = req.params;
    const { tourIds } = req.body;
    const sellerId = req.userId;

    if (!tourIds || !Array.isArray(tourIds) || tourIds.length === 0) {
      return res.status(400).json({
        message: 'Invalid request. Please provide an array of tour IDs.',
      });
    }

    const promotionCheck = await Promotion.checkOwnership(
      promotionId,
      sellerId
    );
    if (!promotionCheck.success) {
      return res
        .status(promotionCheck.status)
        .json({ message: promotionCheck.message });
    }

    const invalidTours = [];
    const validTourIds = [];

    for (const tourId of tourIds) {
      const tourCheck = await checkTourOwnership(tourId, sellerId);
      if (!tourCheck.success) {
        invalidTours.push({ tourId, reason: tourCheck.message });
      } else {
        validTourIds.push(tourId);
      }
    }

    if (validTourIds.length === 0) {
      return res.status(400).json({
        message: 'None of the provided tour IDs are valid or owned by you.',
        invalidTours,
      });
    }

    const result = await Promotion.applyToMultipleTours(
      promotionId,
      validTourIds
    );

    logger.info(
      `Promotion ${promotionId} applied to multiple tours: ${validTourIds.join(
        ', '
      )}`
    );

    return res.status(200).json({
      message: result.message,
      appliedCount: result.appliedCount,
      alreadyAppliedCount: result.alreadyAppliedCount,
      invalidTours: invalidTours.length > 0 ? invalidTours : undefined,
    });
  } catch (error) {
    logger.error(
      `Error applying promotion to multiple tours: ${error.message}`
    );
    next(error);
  }
};

export const removePromotionFromMultipleTours = async (req, res, next) => {
  try {
    const { promotionId } = req.params;
    const { tourIds } = req.body;
    const sellerId = req.userId;

    if (!tourIds || !Array.isArray(tourIds) || tourIds.length === 0) {
      return res.status(400).json({
        message: 'Invalid request. Please provide an array of tour IDs.',
      });
    }

    const promotionCheck = await Promotion.checkOwnership(
      promotionId,
      sellerId
    );
    if (!promotionCheck.success) {
      return res
        .status(promotionCheck.status)
        .json({ message: promotionCheck.message });
    }

    const invalidTours = [];
    const validTourIds = [];

    for (const tourId of tourIds) {
      const tourCheck = await checkTourOwnership(tourId, sellerId);
      if (!tourCheck.success) {
        invalidTours.push({ tourId, reason: tourCheck.message });
      } else {
        validTourIds.push(tourId);
      }
    }

    if (validTourIds.length === 0) {
      return res.status(400).json({
        message: 'None of the provided tour IDs are valid or owned by you.',
        invalidTours,
      });
    }

    const result = await Promotion.removeFromMultipleTours(
      promotionId,
      validTourIds
    );

    logger.info(
      `Promotion ${promotionId} removed from multiple tours: ${validTourIds.join(
        ', '
      )}`
    );

    return res.status(200).json({
      message: result.message,
      removedCount: result.removedCount,
      notAppliedCount: result.notAppliedCount,
      invalidTours: invalidTours.length > 0 ? invalidTours : undefined,
    });
  } catch (error) {
    logger.error(
      `Error removing promotion from multiple tours: ${error.message}`
    );
    next(error);
  }
};
