import User from '../models/User.js';

export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Access denied: Admin role required' });
    }

    next();
  } catch (error) {
    next(error);
  }
};
