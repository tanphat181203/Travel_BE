import dotenv from 'dotenv';
dotenv.config();

import User from '../../models/User.js';
import { hashPassword, comparePassword } from '../../utils/passwordHash.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwtHelper.js';

export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);

    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        message: 'Invalid credentials, or not an admin account',
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateToken({
      id: user.id,
      role: user.role,
      name: user.name,
      status: user.status,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    await User.findByIdAndUpdate(user.id, { refreshToken });

    res.json({
      accessToken,
      refreshToken,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

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
};

export const refreshAdminToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res
        .status(401)
        .json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = generateToken({
      id: user.id,
      role: user.role,
      name: user.name,
      status: user.status,
    });

    res.json({
      accessToken,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
