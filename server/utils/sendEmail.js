const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || "ahmadmurtaza2233@gmail.com",
      pass: process.env.EMAIL_PASS || "czhupnxmdckqhydy",
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'MehndiMe <noreply@mehndime.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
