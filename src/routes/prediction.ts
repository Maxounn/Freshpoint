import { Router } from "express";
import { lastPrediction } from "../storage/memory.js";

const predictionRouter = Router();

predictionRouter.get("/", (_request, result) => {
    if(!lastPrediction.value) {
        return result.status(404).json({ error: "No prediction has been made yet. POST /predict first."});
    }
    result.json(lastPrediction.value)
});

export default predictionRouter