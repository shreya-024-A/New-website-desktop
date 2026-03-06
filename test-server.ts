import express from "express";
const app = express();
app.get("/", (req, res) => res.send("Hello from server"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.listen(3000, "0.0.0.0", () => console.log("Server on 3000"));
