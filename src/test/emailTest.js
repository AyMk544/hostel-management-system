// email-test.js
require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmailSending() {
  // Create a transporter using environment variables
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    auth: {
      user: "ayushmukkanwar2004@gmail.com",
      pass: "",
    },
  });

  //   // Log the configuration (for debugging)
  //   console.log("Email configuration:", {
  //     host: process.env.EMAIL_SERVER_HOST,
  //     port: process.env.EMAIL_SERVER_PORT,
  //     user: process.env.EMAIL_SERVER_USER,
  //     secure: process.env.EMAIL_SERVER_SECURE === "true",
  //     from: process.env.EMAIL_FROM,
  //   });

  try {
    // Send a test email
    const info = await transporter.sendMail({
      from: "ayushmukkanwar2004@gmail.com",
      to: "iib2023021@iiita.ac.in", // Replace with the recipient's email
      subject: "Test Email from Node.js App",
      text: "This is a test email sent from your Node.js application using nodemailer.",
      html: "<p>This is a test email sent from your <b>Node.js</b> application using nodemailer.</p>",
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  testEmailSending()
    .then(() => console.log("Test complete"))
    .catch((error) => console.error("Test failed", error));
}

module.exports = { testEmailSending };
