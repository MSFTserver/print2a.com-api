"use strict";
import https from "https";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import specs from "./swagger.js";
import express from "express";
import cors from "cors";
import readOperations from "./readOperations.js";
import chalk from "chalk";

const port = process.env.PRINT2A_API_PORT || 5756;
const host = process.env.PRINT2A_API_HOST || "0.0.0.0";

const app = express();

app.use(cors());

const corsOptions = {
  key: fs.readFileSync("/etc/nginx/ssl/print2a_key.pem"),
  cert: fs.readFileSync("/etc/nginx/ssl/print2a_cert.pem"),
  origin: 'https://print2a.com',
  optionsSuccessStatus: 200
};

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 *
 * /:
 *   get:
 *     description: Get a response for an existing file or directory path, such that "http://localhost:5757/path/to/file.txt" reads a "/path/to/file.txt"
 *     produces:
 *       - application/json
 *     parameters:
 *       - [existing file path]: the path of the file or directory
 *         type: string
 *     responses:
 *       200:
 *         description: The response with file metadata, proxying fs.stat() — { name, mode, size, username, isDir, birthTime, mtime, ino, path }
 *       404:
 *          description: The resource does not exist on the filesystem
 *
 */
app.get("/*", readOperations);

// Mount the app
app.listen(port, host);
https.createServer(corsOptions, app).listen(7575);
export default app;
