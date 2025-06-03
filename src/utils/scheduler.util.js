const cron = require("node-cron");

const scheduledTasks = [];

/**
 * Schedules a task using node-cron.
 * @param {string} schedule - Cron schedule string (e.g., '0 0 * * *' for daily at midnight).
 * @param {function} task - The function to execute.
 * @param {object} options - node-cron options.
 */
const scheduleTask = (schedule, task, options = {}) => {
  if (!cron.validate(schedule)) {
    console.error(`Invalid cron schedule: ${schedule}`);
    return;
  }

  const job = cron.schedule(schedule, task, {
    scheduled: true,
    timezone: options.timezone || "Africa/Cairo",
    ...options,
  });

  scheduledTasks.push(job);
  console.log(`Task scheduled with pattern: ${schedule}`);
};

/**
 * Starts all registered scheduled tasks.
 */
const startScheduler = () => {
  console.log("Starting scheduler...");
  scheduledTasks.forEach((job) => job.start());
};

/**
 * Stops all registered scheduled tasks.
 */
const stopScheduler = () => {
  console.log("Stopping scheduler...");
  scheduledTasks.forEach((job) => job.stop());
};

module.exports = {
  scheduleTask,
  startScheduler,
  stopScheduler,
};
