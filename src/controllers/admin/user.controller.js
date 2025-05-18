import User from '../../models/User.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const listUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const { users, totalItems } = await User.find(
      { role: 'user' },
      limit,
      offset
    );

    const sanitizedUsers = users.map((user) => {
      const userObj = { ...user };
      delete userObj.password;
      delete userObj.reset_password_token;
      delete userObj.email_verification_token;
      return userObj;
    });

    const pagination = createPaginationMetadata(page, limit, totalItems);

    res.json({
      users: sanitizedUsers,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userStats = await User.getUserStats(userId);

    const sanitizedUser = { ...user };
    delete sanitizedUser.password;
    delete sanitizedUser.reset_password_token;
    delete sanitizedUser.email_verification_token;

    res.json({
      ...sanitizedUser,
      total_confirmed_bookings: parseInt(userStats.total_bookings) || 0,
      total_reviews: parseInt(userStats.total_reviews) || 0
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { status, phone_number, address } = req.body;

    if (userId === req.userId) {
      return res
        .status(400)
        .json({ message: 'Admins cannot update themselves' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status, phone_number, address },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sanitizedUser = { ...user };
    delete sanitizedUser.password;
    delete sanitizedUser.reset_password_token;
    delete sanitizedUser.email_verification_token;

    res.json(sanitizedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (userId === req.userId) {
      return res
        .status(400)
        .json({ message: 'Admins cannot delete themselves' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
