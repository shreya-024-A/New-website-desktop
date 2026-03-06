import express from "express";
import fs from "fs";
const app = express();
fs.writeFileSync("server-started.txt", "STARTED AT " + new Date().toISOString());
app.all("*", (req, res) => {
  console.log(`REQUEST: ${req.method} ${req.path}`);
  res.send(`CATCH ALL: ${req.method} ${req.path}`);
});
app.listen(3000, "0.0.0.0", () => console.log("Server on 3000"));
