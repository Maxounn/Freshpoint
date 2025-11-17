import { Router } from "express";
import { predictSales } from "../services/model.js";
import { lastPrediction } from "../storage/memory.js";

const predictRouter = Router();

predictRouter.post("/", (request, result) => {
    const body = request.body;

    let params = undefined;
    let data = undefined;

    if(Array.isArray(body)){
        data = body;
    } else if(body && typeof body === "object" && Array.isArray(body.data)){
        params = body.params;
        data = body.data
    } else {
        return result.status(400).json({
            error: "Invalid entry. Send array or an object {params, data}."
        })
    }

    for(const item of data){
        if(typeof item.timestamp !== "string" || typeof item.value !== "number") {
            return result.status(400).json({
                error: "Each item must have string 'timestamp' and number 'value'."
            });
        }
    }

    try{
        const predResult = predictSales(params, data)

        lastPrediction.value = {
            timestamp: new Date().toISOString(),
            params: params ?? [],
            predResult
        };

        return result.json(predResult);
    } catch(err) {
        console.error("Prediction error:", err);
        return result.status(500).json({error: "internal error while predicting"})
    }

});

export default predictRouter;

