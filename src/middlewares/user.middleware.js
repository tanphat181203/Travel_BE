import User from '../models/User.js';

export const userMiddleware = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    if (req.role !== 'user') {
      return res
        .status(403)
        .json({ message: 'Access denied: User role required' });
    }
    next();
  } catch (error) {
    next(error);
  }
};
