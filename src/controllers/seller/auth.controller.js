import dotenv from 'dotenv';
dotenv.config();

import User from '../../models/User.js';
import { hashPassword, comparePassword } from '../../utils/passwordHash.js';
import { generateToken } from '../../utils/jwtHelper.js';
import sendEmail from '../../services/emailService.js';

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

    const seller = await User.create({
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
      `Thank you for registering as a seller. Please verify your email: ${process.env.BASE_URL}/api/sellers/verify-email/${emailVerificationToken}`
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

    const token = generateToken({
      id: user.id,
      role: user.role,
    });

    res.json({ token });
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
      `Reset your seller account password: ${process.env.BASE_URL}/api/sellers/reset-password/${resetToken}`
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
