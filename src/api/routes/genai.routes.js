const express = require("express");
const genAiController = require("../controllers/genai.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validation.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: GenAI
 *   description: Generative AI integration (Bonus Feature)
 */

/**
 * @swagger
 * /genai/generate-promo:
 *   post:
 *     summary: Generate a promotional message using GenAI
 *     tags: [GenAI]
 *     description: |
 *       Generates a short, catchy promotional message based on provided context.
 *       Requires Super Admin or Manager role.
 *       Requires GOOGLE_API_KEY to be configured in the environment.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - context
 *             properties:
 *               context:
 *                 type: string
 *                 description: The context for the promotion (e.g., "Weekend specials", "New menu items")
 *             example:
 *               context: "Happy hour deals from 5 PM to 7 PM"
 *     responses:
 *       "200":
 *         description: Promotional message generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 promoMessage:
 *                   type: string
 *                   description: The generated promotional message.
 *               example:
 *                 promoMessage: "Unwind with our amazing happy hour deals! Enjoy special prices on drinks and appetizers, weekdays 5-7 PM. Cheers!"
 *       "400":
 *         description: Bad Request (e.g., missing context)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (User does not have permission)
 *       "500":
 *         description: Internal Server Error (Failed to generate message)
 *       "503":
 *         description: Service Unavailable (GenAI service not configured or unavailable)
 */
router.post(
  "/generate-promo",
  authenticate, 
  authorize(["Super Admin", "Manager"]), 
  genAiController.generatePromo
);

/**
 * @swagger
 * /genai/generate-multi-promo:
 *   post:
 *     summary: Generate three distinct promotional messages for different channels
 *     tags: [GenAI]
 *     description: |
 *       Generates three distinct promotional messages optimized for different channels (SMS, Instagram, Facebook).
 *       Each message is tailored to the specific platform requirements.
 *       Requires Super Admin or Manager role.
 *       Requires GOOGLE_API_KEY to be configured in the environment.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - context
 *             properties:
 *               context:
 *                 type: string
 *                 description: The context for the promotion (e.g., "Weekend specials", "New menu items")
 *               channels:
 *                 type: array
 *                 description: Optional list of channels to generate messages for (defaults to SMS, Instagram, Facebook)
 *                 items:
 *                   type: string
 *             example:
 *               context: "New summer menu with fresh seafood options"
 *               channels: ["SMS", "Instagram", "Facebook"]
 *     responses:
 *       "200":
 *         description: Promotional messages generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 promoMessages:
 *                   type: object
 *                   properties:
 *                     SMS:
 *                       type: string
 *                       description: Short message optimized for SMS (160 chars)
 *                     Instagram:
 *                       type: string
 *                       description: Message with hashtags optimized for Instagram
 *                     Facebook:
 *                       type: string
 *                       description: Message with call-to-action optimized for Facebook
 *               example:
 *                 promoMessages:
 *                   SMS: "Try our new summer seafood menu! Fresh catches daily. Limited time only."
 *                   Instagram: "Dive into summer flavors with our new seafood menu! Fresh from the ocean to your plate. #SummerEats #SeafoodLover #FreshCatch"
 *                   Facebook: "Our NEW Summer Seafood Menu is here! Indulge in the freshest catches of the season, expertly prepared by our chefs. Book your table now to experience these limited-time ocean delights!"
 *       "400":
 *         description: Bad Request (e.g., missing context)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (User does not have permission)
 *       "500":
 *         description: Internal Server Error (Failed to generate messages)
 *       "503":
 *         description: Service Unavailable (GenAI service not configured or unavailable)
 */
router.post(
  "/generate-multi-promo",
  authenticate,
  authorize(["Super Admin", "Manager"]),
  genAiController.generateMultiPromo
);


module.exports = router;
