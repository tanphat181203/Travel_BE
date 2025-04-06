import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/passwordHash.js';
import { generateToken } from '../utils/jwtHelper.js';
import sendEmail from '../services/emailService.js';
import passport from 'passport';

export const register = async (req, res, next) => {
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
    });

    await sendEmail(
      email,
      'Verify Your Email',
      `Verify your email: ${process.env.BASE_URL}/api/auth/verify-email/${emailVerificationToken}`
    );
    res
      .status(201)
      .json({ message: 'User registered. Please verify your email.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user || !user.is_email_verified)
      return res
        .status(401)
        .json({ message: 'Invalid credentials or email not verified' });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken({ id: user.id, role: user.role });
    res.json({ token });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user)
      return res.status(400).json({ message: 'Google login failed' });
    const token = generateToken({ id: user.id, role: user.role });
    res.json({ token });
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
      `Reset your password: ${process.env.BASE_URL}/api/auth/reset-password/${resetToken}`
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
      is_email_verified: true,
      email_verification_token: null,
      status: 'active',
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};
