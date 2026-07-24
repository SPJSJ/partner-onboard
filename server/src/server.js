import "dotenv/config";
import "./db.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Partner Onboard API listening on http://localhost:${PORT}`);
});
