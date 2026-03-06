import express from "express";
const app = express();
app.get("/", (req, res) => res.send("Hello from server JS"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.listen(3000, "0.0.0.0", () => console.log("Server on 3000 JS"));
