import express from "express";
import cors from "cors";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes ici
// app.get("/", (req, res) => res.send("API is working"));

export default app;
