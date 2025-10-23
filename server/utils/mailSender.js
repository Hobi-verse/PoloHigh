// Using SendGrid for email delivery
const sgMail = require('@sendgrid/mail');

// Comment out old nodemailer implementation
/*
const nodemailer = require("nodemailer");

const mailSender = async (to, subject, text) => {
  try {
    // Debug: Check if env variables are loaded
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS is set:", !!process.env.EMAIL_PASS);

    // Production-optimized Gmail transporter config for Render
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Render-specific optimizations
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 15000, // 15 seconds
      socketTimeout: 30000, // 30 seconds
      pool: false, // Disable pooling for Render's stateless environment
      maxConnections: 1, // Single connection for Render
      secure: true,
      requireTLS: true,
      tls: {
        rejectUnauthorized: false // Allow for hosting environments
      }
    });

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    // Set timeout for the entire send operation
    const emailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email timeout after 20 seconds')), 20000);
    });

    const info = await Promise.race([emailPromise, timeoutPromise]);
    
    console.log("✅ Mail sent successfully:", info.response);
    
    // Close the transporter immediately after sending
    transporter.close();
    
    return info;
  } catch (error) {
    console.error("❌ Error in mailSender:", error.message);
    
    // Provide more specific error messages for production debugging
    if (error.code === 'EAUTH') {
      console.error("❌ Email authentication failed - check EMAIL_USER and EMAIL_PASS");
    } else if (error.code === 'ENOTFOUND') {
      console.error("❌ Gmail SMTP server not found - network issue");
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.error("❌ Email timeout - Render hosting limitation");
    }
    
    throw error;
  }
};
*/

// SendGrid implementation with Gmail fallback
const nodemailer = require("nodemailer");

const mailSender = async (to, subject, text, html = null) => {
  // Always try SendGrid first (works on Render free tier)
  if (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('SG.')) {
    try {
      const apiKey = process.env.SMTP_PASS.trim();
      sgMail.setApiKey(apiKey);
      
      console.log("🔄 Attempting SendGrid delivery...");
      console.log("API Key prefix:", apiKey.substring(0, 10) + "...");

      const senderEmail = process.env.EMAIL_USER || 'dumbledore932@gmail.com';
      
      const msg = {
        to,
        from: {
          email: senderEmail,
          name: process.env.APP_NAME || 'CiyaTake'
        },
        subject,
        text,
      };
      
      if (html) {
        msg.html = html;
      }

      const sendPromise = sgMail.send(msg);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SendGrid timeout')), 20000);
      });

      await Promise.race([sendPromise, timeoutPromise]);
      
      console.log("✅ SendGrid mail sent successfully to:", to);
      
      return { 
        success: true,
        response: 'Email sent successfully via SendGrid'
      };
    } catch (error) {
      console.error("❌ SendGrid failed:", error.message);
      if (error.response) {
        console.error("❌ SendGrid API error:", error.response.body);
      }
      
      // On Render, Gmail SMTP might not work due to port restrictions
      if (process.env.NODE_ENV === 'production') {
        console.error("⚠️ Running in production - Gmail fallback may not work on Render free tier");
      }
      
      console.log("🔄 Falling back to Gmail SMTP...");
      // Fall through to Gmail fallback
    }
  }

  // Gmail fallback
  try {
    console.log("📧 Using Gmail SMTP...");
    
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
      pool: false,
      maxConnections: 1,
      secure: true,
      requireTLS: true,
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'CiyaTake'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    if (html) {
      mailOptions.html = html;
    }

    const emailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gmail timeout after 20 seconds')), 20000);
    });

    const info = await Promise.race([emailPromise, timeoutPromise]);
    
    console.log("✅ Gmail mail sent successfully:", info.response);
    
    transporter.close();
    
    return {
      success: true,
      response: info.response
    };
  } catch (error) {
    console.error("❌ Gmail SMTP also failed:", error.message);
    
    if (error.code === 'EAUTH') {
      console.error("❌ Email authentication failed - check EMAIL_USER and EMAIL_PASSWORD");
    } else if (error.code === 'ENOTFOUND') {
      console.error("❌ Gmail SMTP server not found - network issue");
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.error("❌ Email timeout - network limitation");
    }
    
    throw error;
  }
};

module.exports = mailSender;