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
import passport from 'passport';

export const registerUser = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: 'Email and password are required' });

    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await hashPassword(password);
    const emailVerificationToken = generateToken({ email });

    await User.create({
      email,
      password: hashedPassword,
      name,
      emailVerificationToken,
      role: 'user',
      status: 'pending_verification',
    });

    await sendEmail(
      email,
      'Verify Your Email',
      `Verify your email: ${process.env.BASE_URL}/api/user/auth/verify-email/${emailVerificationToken}`
    );
    res
      .status(201)
      .json({ message: 'User registered. Please verify your email.' });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user || user.status === 'pending_verification' || user.role !== 'user')
      return res
        .status(401)
        .json({
          message:
            'Invalid credentials, email not verified, or not a user account',
        });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

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
      user: {
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

export const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user)
      return res.status(400).json({ message: 'Google login failed' });

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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  })(req, res, next);
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = generateToken({ id: user.id });

    await User.findByIdAndUpdate(user.id, {
      resetPasswordToken: resetToken,
    });

    await sendEmail(
      email,
      'Reset Your Password',
      `Reset your password: ${process.env.BASE_URL}/api/user/auth/reset-password/${resetToken}`
    );

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({ message: 'Valid password is required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
    });

    if (!user) return res.status(400).json({ message: 'Invalid reset token' });

    const hashedPassword = await hashPassword(password);

    await User.findByIdAndUpdate(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user)
      return res.status(400).json({ message: 'Invalid verification token' });

    await User.findByIdAndUpdate(user.id, {
      emailVerificationToken: null,
      status: 'active',
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return res.status(400).json({ message: 'Valid new password is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Old password is incorrect' });

    const hashedPassword = await hashPassword(newPassword);

    await User.findByIdAndUpdate(user.id, {
      password: hashedPassword,
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
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
    if (!user || user.refreshToken !== refreshToken) {
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
      user: {
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
