import express from "express";
import cors from "cors";

import predictRouter from "./routes/predict.js";
import { PORT } from "./config/env.js";
import predictionRouter from "./routes/prediction.js";

const predictor = express();

predictor.use(cors());
predictor.use(express.json());

predictor.use("/predict", predictRouter);
predictor.use("/prediction", predictionRouter);

predictor.get("/", (request, result) => {
  result.json({ status: "ok", message: "FreshPoint API is running" });
});

predictor.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
})

