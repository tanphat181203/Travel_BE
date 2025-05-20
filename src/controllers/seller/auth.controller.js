import dotenv from 'dotenv';
dotenv.config();

import User from '../../models/User.js';
import { hashPassword, comparePassword } from '../../utils/passwordHash.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwtHelper.js';
import sendEmail from '../../services/email.service.js';

export const registerSeller = async (req, res, next) => {
  try {
    const { email, password, name, phone_number, address } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const emailVerificationToken = generateToken({ email });

    await User.create({
      email,
      password: hashedPassword,
      name,
      phone_number,
      address,
      emailVerificationToken,
      role: 'seller',
      status: 'pending_verification',
    });

    await sendEmail(
      email,
      'Verify Your Seller Account Email',
      `Thank you for registering as a seller. Please verify your email: ${process.env.BASE_URL}/api/seller/auth/verify-email/${emailVerificationToken}`
    );

    res.status(201).json({
      message: 'Seller registered. Please verify your email.',
    });
  } catch (error) {
    next(error);
  }
};

export const loginSeller = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);

    if (
      !user ||
      user.status === 'pending_verification' ||
      user.role !== 'seller'
    ) {
      return res.status(401).json({
        message:
          'Invalid credentials, email not verified, or not a seller account',
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
      seller: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifySellerEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    if (user.role !== 'seller') {
      return res
        .status(400)
        .json({ message: 'This token is not for a seller account' });
    }

    await User.findByIdAndUpdate(user.id, {
      emailVerificationToken: null,
      status: 'active',
    });

    res.json({ message: 'Seller email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotSellerPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (user.role !== 'seller') {
      return res
        .status(400)
        .json({ message: 'Email is not registered as a seller' });
    }

    const resetToken = generateToken({ userId: user.id });

    await User.findByIdAndUpdate(user.id, {
      resetPasswordToken: resetToken,
    });

    await sendEmail(
      email,
      'Reset Your Seller Account Password',
      `Reset your seller account password: ${process.env.BASE_URL}/api/seller/auth/reset-password/${resetToken}`
    );

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
};

export const resetSellerPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({ message: 'Valid password is required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    if (user.role !== 'seller') {
      return res
        .status(400)
        .json({ message: 'This token is not for a seller account' });
    }

    const hashedPassword = await hashPassword(password);

    await User.findByIdAndUpdate(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
    });

    res.json({ message: 'Seller password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const changeSellerPassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return res.status(400).json({ message: 'Valid new password is required' });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await User.findByIdAndUpdate(user.id, {
      password: hashedPassword,
    });

    res.json({ message: 'Seller password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshSellerToken = async (req, res, next) => {
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
    if (!user || user.refreshToken !== refreshToken || user.role !== 'seller') {
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
      seller: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
};
