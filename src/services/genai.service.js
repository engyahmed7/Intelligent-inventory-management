require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../../config/config");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

if (!config.googleApiKey) {
  console.warn(
    "GOOGLE_API_KEY is not set in the environment variables. Gen AI features will be disabled."
  );
}

const genAI = config.googleApiKey
  ? new GoogleGenerativeAI(config.googleApiKey)
  : null;
const model = genAI
  ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  : null; 

/**
 * Generates a promotional message based on given items or themes.
 * @param {string} promptContext - Context for the promotion (e.g., "items on sale", "new arrivals").
 * @returns {Promise<string>} - The generated promotional message.
 */
const generatePromoMessage = async (promptContext) => {
  if (!model) {
    throw new ApiError(500, "Gen AI service is not configured or unavailable.");
  }

  const prompt = `Generate a short, catchy promotional message (max 2 sentences) for a restaurant based on the following context: ${promptContext}. Be creative and engaging.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error("Error generating promo message from Gen AI:", error);
    throw new ApiError(500, "Failed to generate promotional message.");
  }
};

/**
 * Generates an email summary for administrators based on provided data.
 * @param {string} triggerEvent - The event triggering the email (e.g., "Item Expiry Report", "Daily Sales Summary").
 * @param {object} data - Data to include in the summary (e.g., list of expiring items, sales figures).
 * @returns {Promise<{subject: string, body: string}>} - Generated email subject and body.
 */
const generateAdminEmail = async (triggerEvent, data) => {
  if (!model) {
    throw new ApiError(500, "Gen AI service is not configured or unavailable.");
  }

  let dataString;
  try {
    dataString = JSON.stringify(data, null, 2); 
    if (dataString.length > 10000) {
      dataString = JSON.stringify({
        summary:
          "Data too large for prompt, see attached report or system logs.",
      });
    }
  } catch (e) {
    dataString = "Error formatting data for prompt.";
  }

  const prompt = `
You are a system that generates summary emails for restaurant administrators.

Please generate an HTML-formatted professional email regarding: **"${triggerEvent}"**.

Use the following JSON data to summarize key insights (e.g., items expiring soon, items expired, discounted, or excluded):
${dataString}

Output format:
Subject: [Write a clear, concise subject line]
HTMLBody: [Generate well-structured HTML using <h2>, <ul>, <li>, and styled <p> elements — avoid <style> tags, keep it clean for email clients]

Tone: Professional, informative, and easy to read.
`;

  try {
    console.log("Prompt for Gen AI:", prompt);
    const result = await model.generateContent(prompt);
    console.log("Generated content from Gen AI:", result);
    const response = result.response;
    if (!response || !response.text) {
      throw new ApiError(500, "Gen AI response is invalid or empty.");
    }
    const text = response.text();

    const subjectMatch = text.match(/^Subject:\s*(.*)/m);
    const htmlMatch = text.match(/HTMLBody:\s*([\s\S]*)/m);

    const subject =
      subjectMatch?.[1]?.trim() ?? `Admin Update: ${triggerEvent}`;
    const body = htmlMatch?.[1]?.trim() ?? text;

    return { subject, body };
  } catch (error) {
    console.error(
      `Error generating admin email for ${triggerEvent} from Gen AI:`,
      error
    );
    throw new ApiError(
      500,
      `Failed to generate admin email for ${triggerEvent}.`
    );
  }
};

module.exports = {
  generatePromoMessage,
  generateAdminEmail,
  isGenAiAvailable: () => !!model,
};
