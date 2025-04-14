import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';

export const generateToken = (data) => {
  const payload = {
    userId: data.id || data._id,
    role: data.role || 'user',
    name: data.name,
    status: data.status,
    tokenType: 'access',
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export const generateRefreshToken = (data) => {
  const payload = {
    userId: data.id || data._id,
    tokenType: 'refresh',
  };
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

export const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  );
};
