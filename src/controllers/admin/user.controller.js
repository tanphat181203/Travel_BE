import User from '../../models/User.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' });

    const sanitizedUsers = users.map((user) => {
      const userObj = { ...user };
      delete userObj.password;
      delete userObj.reset_password_token;
      delete userObj.email_verification_token;
      return userObj;
    });

    res.json(sanitizedUsers);
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
