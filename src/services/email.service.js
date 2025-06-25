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

const sendEmail = async (to, subject, text) => {
  const result = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
  
  return result;
};

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
