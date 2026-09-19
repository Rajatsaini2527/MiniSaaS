'use strict';

const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) { return transporter; }

  if (env.SMTP_HOST && env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  } else {
    // Development: log emails to console
    transporter = {
      sendMail: async (opts) => {
        logger.info(`[DEV EMAIL] To: ${opts.to} | Subject: ${opts.subject}`);
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  const info = await t.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]+>/g, ''),
  });
  logger.info(`Email sent: ${info.messageId}`);
  return info;
}

async function sendWorkspaceInvite({ to, inviterName, workspaceName, role }) {
  return sendEmail({
    to,
    subject: `${inviterName} invited you to "${workspaceName}"`,
    html: `
      <h2>You've been invited!</h2>
      <p><strong>${inviterName}</strong> has added you to the workspace <strong>${workspaceName}</strong> as <em>${role}</em>.</p>
      <p><a href="${env.CORS_ORIGIN}/login">Sign in to get started</a></p>
    `,
  });
}

module.exports = { sendEmail, sendWorkspaceInvite };
