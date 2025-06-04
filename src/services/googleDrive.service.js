const fs = require("fs");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;

exports.uploadToDrive = async (tokens, filePath, mimeType, fileName) => {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(tokens);

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const fileMetadata = { name: fileName };
  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id",
  });

  return file.data.id;
};
