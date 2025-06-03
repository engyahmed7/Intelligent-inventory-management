const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const authService = require("../../services/auth.service");

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

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
};
