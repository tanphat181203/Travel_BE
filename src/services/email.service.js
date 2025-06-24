import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a plain text email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text email content
 * @returns {Promise<Object>} - Email send result
 */
const sendEmail = async (to, subject, text) => {
  const result = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
  
  return result;
};

/**
 * Send an email with HTML content and optional attachments
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @param {Array} attachments - Array of attachment objects
 * @returns {Promise<Object>} - Email send result
 */
export const sendHtmlEmail = async (to, subject, html, attachments = []) => {
  const result = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments,
  });
  
  return result;
};

export default sendEmail;
