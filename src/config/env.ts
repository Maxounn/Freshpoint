import { configDotenv } from "dotenv";

configDotenv();

export const PORT = Number(process.env.PORT ?? 3000);