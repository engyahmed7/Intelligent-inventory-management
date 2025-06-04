const { google } = require("googleapis");
const dayjs = require("dayjs");

/**
 * Adds a reminder event to Google Calendar
 * @param {string} accessToken
 * @param {string} refreshToken
 * @param {object} item { name, stockQuantity, expiryDate }
 */
const addExpiryReminder = async (accessToken, refreshToken, item) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  console.log("Adding expiry reminder to calendar with items", item);
  const event = {
    summary: `Use by ${dayjs(item.expiryDate).format("DD/MM")}: ${
      item.quantity > 1 ? `${item.quantity} items` : "1 item"
    } ${item.name}`,
    description: `This item is nearing expiry.`,
    start: {
      date: dayjs(item.expiryDate).format("YYYY-MM-DD"),
    },
    end: {
      date: dayjs(item.expiryDate).add(1, "day").format("YYYY-MM-DD"),
    },
  };

  await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });
};

module.exports = { addExpiryReminder };
