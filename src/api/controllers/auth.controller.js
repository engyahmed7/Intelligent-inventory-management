const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const authService = require("../../services/auth.service");
const { oauth2Client } = require("../../../config/googleDrive");
const { User } = require("../../models");
const jwt = require("jsonwebtoken");

const scopes = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar",
];
const register = catchAsync(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(201).send({ user });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.loginUser(email, password);
  res.send({ user, token });
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(200).send({ message: "Email verified successfully." });
});

const requestPasswordReset = catchAsync(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  res.status(200).send({
    message:
      "If an account with that email exists, a password reset link has been sent.",
  });
});

const resetPassword = catchAsync(async (req, res) => {
  console.log("Resetting password with token:");
  const { password } = req.body;
  console.log("New password:", req.body);

  console.log("Resetting password with token:", req.query.token);
  await authService.resetPassword(req.query.token, password);
  res.status(200).send({ message: "Password has been reset successfully." });
});

const googleAuth = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state: token,
  });

  res.redirect(url);
};

const googleCallback = async (req, res) => {
  const { code, state } = req.query;

  if (!state) return res.status(400).send({ message: "Missing user state." });

  let decoded;
  try {
    decoded = jwt.verify(state, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);
  } catch (err) {
    return res.status(401).send({ message: "Invalid or expired token." });
  }

  const { sub } = decoded;
  console.log("User ID from JWT:", sub);
  const { tokens } = await oauth2Client.getToken(code);
  console.log("Google tokens received:", tokens);

  const userData = await User.findOne({ where: { id: sub } });
  if (!userData) {
    return res.status(404).send({ message: "User not found." });
  }
  userData.googleTokens = tokens;
  await userData.save();

  res.status(200).send("Google Drive connected! Tokens saved.");
};

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  googleAuth,
  googleCallback,
};
