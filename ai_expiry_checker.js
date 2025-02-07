import { HuggingFaceInference } from "@langchain/community/llms/huggingface";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Item from "./src/itemModel.js";
import Post from "./src/postmodel.js"; // Import orphanage posts schema
import nodemailer from "nodemailer";

dotenv.config();

// Initialize MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB Connected...");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Initialize HuggingFace Model
const model = new HuggingFaceInference({
  model: "tiiuae/falcon-7b-instruct", // Example: Replace with your chosen model
  apiKey: process.env.HF_API_KEY,
});

/**
 * Function to check for expiring products and notify store personnel
 */
export const checkExpiringProducts = async () => {
  const today = new Date();
  const expiryThreshold = new Date();
  expiryThreshold.setDate(today.getDate() + 3); // Items expiring in 3 days

  // Find items that will expire soon
  const expiringItems = await Item.find({
    expiryDate: { $lte: expiryThreshold },
    status: "Available",
  });

  if (expiringItems.length === 0) {
    console.log("No expiring products found.");
    return;
  }

  // Generate AI-based notification message
  const prompt = `
    The following food items in our inventory are expiring soon:
    ${expiringItems.map((item) => `- ${item.itemName} (${item.quantity} ${item.unit}) in ${item.location}, expires on ${item.expiryDate}`).join("\n")}

    Notify store personnel and recommend donation before expiration.
  `;

  const response = await model.invoke(prompt);
  console.log("AI Notification:", response);
};

/**
 * Match Expiring Items with Orphanage Requests
 */
export const matchExpiringItemsWithRequests = async () => {
  const today = new Date();
  const expiryThreshold = new Date();
  expiryThreshold.setDate(today.getDate() + 3); // Items expiring in 3 days

  const expiringItems = await Item.find({
    expiryDate: { $lte: expiryThreshold },
    status: "Available",
  });

  if (expiringItems.length === 0) return;

  const orphanageRequests = await Post.find({});

  // AI Matching logic
  for (const item of expiringItems) {
    const matchingRequests = orphanageRequests.filter((post) =>
      post.itemName.toLowerCase().includes(item.itemName.toLowerCase()) &&
      post.urgency === "High"
    );

    if (matchingRequests.length > 0) {
      const recommendationPrompt = `
        The following orphanage requests match the expiring food items:
        - Expiring Item: ${item.itemName} (${item.quantity} ${item.unit}), Location: ${item.location}, Expiry: ${item.expiryDate}
        - Recommended Orphanages:
        ${matchingRequests.map((post) => `- ${post.itemName}, Location: ${post.location}, Urgency: ${post.urgency}`).join("\n")}

        Notify store personnel to prioritize donations.
      `;

      const response = await model.invoke(recommendationPrompt);
      console.log("AI Recommendation:", response);

      // Send Email Recommendation
      await sendEmailNotification("Matching Food Donations", response);
    }
  }
};

/**
 * Send Email Notifications
 */
export const sendEmailNotification = async (subject, message) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.STORE_EMAIL,
    subject: subject,
    text: message,
  };

  await transporter.sendMail(mailOptions);
  console.log("Email sent:", subject);
};

/**
 * Run Functions After Connecting to MongoDB
 */
const runTasks = async () => {
  await connectDB();
  await checkExpiringProducts();
  await matchExpiringItemsWithRequests();
};

await runTasks();
