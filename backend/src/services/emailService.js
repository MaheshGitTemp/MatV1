// services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from:    process.env.EMAIL_FROM,
    to:      toEmail,
    subject: 'Your OTP for TeluguSambandham Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #a84040; text-align: center;">TeluguSambandham</h2>
        <h3 style="text-align: center;">Email Verification</h3>
        <p>Thank you for registering! Please use the OTP below to verify your email address.</p>
        <div style="background: #f8f9fa; border: 2px dashed #a84040; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #a84040; font-size: 40px; letter-spacing: 10px; margin: 0;">
            ${otp}
          </h1>
        </div>
        <p style="color: #666; font-size: 13px;">
          This OTP is valid for <strong>10 minutes</strong>.<br/>
          Do not share this OTP with anyone.
        </p>
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you did not request this, please ignore this email.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  return true;
};

module.exports = { sendOtpEmail };