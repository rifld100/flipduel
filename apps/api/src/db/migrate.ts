import "dotenv/config";
import { migrate } from "./index.js";

migrate();
console.log("Database migrated.");
