import dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';

export async function customFetch(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.AI_SERVER_KEY}`,
    'ngrok-skip-browser-warning': 'true',
  };

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  return fetch(url, mergedOptions);
}
