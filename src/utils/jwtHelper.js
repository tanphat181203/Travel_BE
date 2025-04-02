import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';

export const generateToken = (data) => {
  const payload = {
    userId: data.id || data._id,
    role: data.role || 'user',
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
