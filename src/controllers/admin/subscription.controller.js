import SubscriptionPackage from '../../models/SubscriptionPackage.js';
import SellerSubscription from '../../models/SellerSubscription.js';
import logger from '../../utils/logger.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';
import { updateExpiredSubscriptions } from '../../utils/cronJobs.js';

export const getAllSubscriptionPackages = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const filters = {
      status: req.query.status,
    };

    const { packages, totalItems } = await SubscriptionPackage.findAll(
      filters,
      limit,
      offset
    );

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Admin retrieved ${packages.length} subscription packages (page ${page})`
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

export const createSubscriptionPackage = async (req, res) => {
  try {
    const {
      package_name,
      description,
      price,
      duration_days,
      status = 'active',
    } = req.body;

    if (!package_name || !price || !duration_days) {
      return res.status(400).json({
        message: 'Missing required fields: package_name, price, duration_days',
      });
    }

    const packageData = {
      package_name,
      description,
      price,
      duration_days,
      status,
    };

    const newPackage = await SubscriptionPackage.create(packageData);

    logger.info(
      `Admin created new subscription package: ${newPackage.package_id}`
    );

    res.status(201).json(newPackage);
  } catch (error) {
    logger.error(`Error creating subscription package: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSubscriptionPackage = async (req, res) => {
  try {
    const packageId = req.params.id;
    const { package_name, description, price, duration_days, status } =
      req.body;

    const existingPackage = await SubscriptionPackage.findById(packageId);
    if (!existingPackage) {
      return res
        .status(404)
        .json({ message: 'Subscription package not found' });
    }

    const updateData = {};
    if (package_name) updateData.package_name = package_name;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = price;
    if (duration_days) updateData.duration_days = duration_days;
    if (status) updateData.status = status;

    const updatedPackage = await SubscriptionPackage.update(
      packageId,
      updateData
    );

    logger.info(`Admin updated subscription package: ${packageId}`);

    res.status(200).json(updatedPackage);
  } catch (error) {
    logger.error(`Error updating subscription package: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSubscriptionPackage = async (req, res) => {
  try {
    const packageId = req.params.id;

    const existingPackage = await SubscriptionPackage.findById(packageId);
    if (!existingPackage) {
      return res
        .status(404)
        .json({ message: 'Subscription package not found' });
    }

    try {
      const deletedPackage = await SubscriptionPackage.delete(packageId);
      logger.info(`Admin deleted subscription package: ${packageId}`);
      res.status(200).json(deletedPackage);
    } catch (error) {
      if (error.message.includes('existing subscriptions')) {
        return res.status(400).json({
          message:
            'Cannot delete package with existing subscriptions. Consider marking it as inactive instead.',
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error deleting subscription package: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllSellerSubscriptions = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const { subscriptions, totalItems } =
      await SellerSubscription.findAllForAdmin(limit, offset);

    const pagination = createPaginationMetadata(page, limit, totalItems);

    logger.info(
      `Admin retrieved ${subscriptions.length} seller subscriptions (page ${page})`
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

export const triggerExpiredSubscriptionsUpdate = async (req, res) => {
  try {
    logger.info('Manual trigger: Update expired subscriptions');

    const result = await updateExpiredSubscriptions();

    if (result.success) {
      return res.status(200).json({
        message: `Successfully updated ${result.count} expired subscriptions`,
        count: result.count,
        updatedSubscriptions: result.updatedSubscriptions,
      });
    } else {
      return res.status(500).json({
        message: 'Failed to update expired subscriptions',
        error: result.error,
      });
    }
  } catch (error) {
    logger.error(
      'Error in manual trigger of expired subscriptions update:',
      error
    );
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
