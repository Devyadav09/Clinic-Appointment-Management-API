import express from "express";
import routes from "./routes";
import { errorHandler } from "./common/middleware/error.middleware";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use("/api/v1", routes);
app.use(errorHandler);

export default app;