require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET === "replace_this_with_a_long_random_secret") {
    throw new Error("Set a real JWT_SECRET in your .env file");
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`Sevora API running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});