const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const genAiService = require("../../services/genai.service");
const ApiError = require("../../utils/ApiError");

/**
 * Generate a single promotional message based on provided context
 * @route POST /genai/generate-promo
 */
const generatePromo = catchAsync(async (req, res) => {
  if (!genAiService.isGenAiAvailable()) {
    throw new ApiError(500, "Gen AI service is not configured or unavailable.");
  }
  const { context } = req.body;
  if (!context) {
    throw new ApiError(
      400,
      "Missing 'context' in request body for promo generation."
    );
  }
  const message = await genAiService.generatePromoMessage(context);
  res.status(200).send({ promoMessage: message });
});

/**
 * Generate three distinct promotional messages for different channels (SMS, social media)
 * @route POST /genai/generate-multi-promo
 */
const generateMultiPromo = catchAsync(async (req, res) => {
  if (!genAiService.isGenAiAvailable()) {
    throw new ApiError(500, "Gen AI service is not configured or unavailable.");
  }

  const { context, channels } = req.body;

  if (!context) {
    throw new ApiError(
      400,
      "Missing 'context' in request body for promo generation."
    );
  }

  const targetChannels = channels || ["SMS", "Instagram", "Facebook"];

  const promoMessages = {};

  for (const channel of targetChannels) {
    try {
      const channelContext = `${context} for ${channel} platform. ${
        channel === "SMS"
          ? "Keep it very short (max 160 characters)."
          : channel === "Instagram"
          ? "Include relevant hashtags."
          : channel === "Facebook"
          ? "Make it engaging with a call to action."
          : ""
      }`;

      const message = await genAiService.generatePromoMessage(channelContext);
      promoMessages[channel] = message;
    } catch (error) {
      console.error(`Error generating promo for ${channel}:`, error);
      promoMessages[channel] = `Failed to generate message for ${channel}`;
    }
  }

  res.status(200).send({ promoMessages });
});

module.exports = {
  generatePromo,
  generateMultiPromo,
};
