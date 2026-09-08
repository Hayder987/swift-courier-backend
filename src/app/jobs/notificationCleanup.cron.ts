import cron from "node-cron";
import { prisma } from "../lib/prisma";


const notificationCleanupCron = () => {
  cron.schedule(
    "0 * * * *",
    async () => {
      try {
        const now = new Date();

        const result = await prisma.notification.deleteMany({
          where: {
            notificationDeadline: {
              not: null,
              lte: now,
            },
          },
        });

        if (result.count > 0) {
          console.log(
            `[Notification Cron] ${result.count} expired notification(s) deleted.`,
          );
        }
      } catch (error) {
        console.error(
          "[Notification Cron] Failed to delete expired notifications:",
          error,
        );
      }
    },
    {
      timezone: "Asia/Dhaka",
    },
  );

  console.log("Notification cleanup cron started successfully.");
};

export default notificationCleanupCron;
