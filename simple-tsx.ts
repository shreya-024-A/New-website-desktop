console.log("TSX IS WORKING");
import express from "express";
const app = express();
app.get("/", (req, res) => res.send("TSX SERVER WORKING"));
app.listen(3000, "0.0.0.0", () => console.log("Server on 3000"));
