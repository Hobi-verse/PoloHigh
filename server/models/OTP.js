const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const OTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      },
      required: true,
    },
    // Track if OTP has been used to prevent reuse
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, //Enables createdAt & updatedAt
  }
);

// TTL (15 mins = 900 seconds) based on createdAt
OTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

// Define a function to send the email using SendGrid
async function sendVerificationEmail(email, otp) {
  try {
    const subject = `Verify your ${process.env.APP_NAME || 'CiyaTake'} account - OTP inside`;
    const text = `Hello,

Thank you for signing up with ${process.env.APP_NAME || 'CiyaTake'}!

Your verification code is: ${otp}

This code will expire in 15 minutes.

For your security:
- Never share this code with anyone
- Our team will never ask for this code
- If you didn't request this, please ignore this email

Need help? Contact our support team.

Best regards,
The ${process.env.APP_NAME || 'CiyaTake'} Team`;

    // HTML version with anti-spam best practices
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; color: #b8985b; font-size: 32px; font-weight: 600;">${process.env.APP_NAME || 'CiyaTake'}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600; text-align: center;">Verify Your Account</h2>
              
              <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>
              
              <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Thank you for signing up with ${process.env.APP_NAME || 'CiyaTake'}! To complete your registration, please use the verification code below:
              </p>
              
              <!-- OTP Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; border: 2px dashed #b8985b;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                    <p style="margin: 0; color: #b8985b; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                This code will expire in <strong>15 minutes</strong>.
              </p>
              
              <!-- Security Notice -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: 600;">🔒 Security Tips:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.6;">
                      <li>Never share this code with anyone</li>
                      <li>Our team will never ask for this code</li>
                      <li>If you didn't request this, please ignore this email</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #555555; font-size: 15px; line-height: 1.6;">
                Need help? Feel free to contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px 0; color: #888888; font-size: 13px; text-align: center; line-height: 1.5;">
                This is an automated message, please do not reply to this email.
              </p>
              <p style="margin: 0; color: #888888; font-size: 13px; text-align: center;">
                © ${new Date().getFullYear()} ${process.env.APP_NAME || 'CiyaTake'}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Pass both text and HTML versions to mailSender
    const mailResponse = await mailSender(email, subject, text, html);
    console.log("✅ SendGrid email sent successfully", mailResponse.response);
    return mailResponse;
  } catch (error) {
    console.error("❌ Error occurred while sending email:", error.message);
    throw error;
  }
}

// Define a pre-save hook to send email before the document is saved
OTPSchema.pre("save", async function (next) {
  try {
    // Only send email for new documents (not updates)
    if (this.isNew) {
      await sendVerificationEmail(this.email, this.otp);
      console.log(`✅ OTP email sent successfully for: ${this.email}`);
    }
  } catch (error) {
    console.error("❌ Error sending verification email:", error.message);
    
    // In development, show fallback OTP and continue
    if (process.env.NODE_ENV !== "production") {
      console.log(`🔐 FALLBACK OTP for ${this.email}: ${this.otp}`);
    } else {
      // In production, log error but continue with save to prevent 500 errors
      console.error(`❌ Production email failure for ${this.email}:`, {
        error: error.message,
        otp: this.otp,
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
});

module.exports = mongoose.model("OTP", OTPSchema);
