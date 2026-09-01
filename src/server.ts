import app from "./app";
import { prisma } from "./app/lib/prisma";

const PORT = 5000;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the swift database successfully.");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} SuccessFully!`);
    });
  } catch (error) {
    console.error("Error Found On starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();
