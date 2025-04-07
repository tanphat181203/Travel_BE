import dotenv from 'dotenv';
dotenv.config();

import User from '../../models/User.js';
import { hashPassword, comparePassword } from '../../utils/passwordHash.js';
import { generateToken } from '../../utils/jwtHelper.js';

export const loginAdmin = async (req, res, next) => {
  try {
    const {email, password} = req.body;

    const user = await User.findByEmail(email);

    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        message:
          'Invalid credentials, or not an admin account',
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
    });

    res.json({ token });
  } catch (error) {
    next(error);
  }
}

export const changeAdminPassword = async (req, res, next) => {
  try {
    const { id } = req.userId;
    const { newPassword } = req.body;

    if (req.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Access denied. Admin privileges required.' });
    }

    const user = await User.findById(id);

    if (!user || user.role !== 'admin') {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    const hashedPassword = await hashPassword(newPassword);
    
    await User.findByIdAndUpdate(id, {
      password: hashedPassword,
    });

    res.json({ message: 'Admin password changed successfully' });
  } catch (error) {
    next(error);
  }
}