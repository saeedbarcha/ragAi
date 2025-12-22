import express from "express";
import cors from "cors";
import path from "path";
import hbs from "hbs";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import { pageRouter } from "./routes/page.routes.js";
import { apiRouter } from "./routes/api.routes.js";
import { ingestRouter } from "./routes/ingest.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));

// HBS setup
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
hbs.registerPartials(path.join(__dirname, "views/partials"));

// Routes
app.use("/", pageRouter);
app.use("/api", apiRouter);
app.use("/api", ingestRouter);


app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
