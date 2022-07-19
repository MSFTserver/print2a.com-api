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
  cert: fs.readFileSync("/etc/nginx/ssl/print2a_cert.pem")
};

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 *
 * /{id}:
 *   get:
 *     summary: get data for Chonky.io navigation
 *     description: Get a response for an existing file or directory path
 *     type: string
 *     produces:
 *       - application/json
 *     parameters:
 *       - [existing file path]: the path of the file or directory
 *         type: string
 *         name: id
 *         in: path
 *         description: path/to/folder
 *         required: true
 *         schema:
 *           type: string
 *           example: print2a
 *     responses:
 *       200:
 *         description: The response with file metadata, proxying fs.stat() — { id, name, mode, size, sizeHuman, username, isDir, birthtime, mtime, childrenCount, path }
 *       404:
 *          description: The resource does not exist on the filesystem
 *
 */

/**
 * @swagger
 *
 * /GetFile:
 *   get:
 *     summary: get file data
 *     description: Get a response for an existing files data depending on the file type (image, text, model, folder)\n the api will supply either a base64 image, a plaintext model, a text file or a zip file
 *     produces:
 *       - application/json
 *       - text/plain
 *     parameters:
 *       - [existing file path]: the path of the file or directory
 *         type: string
 *         name: fileLocation
 *         description: path to file
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: print2a/readme.md
 *     responses:
 *       200:
 *         description: the response either of data types (image, text, model, folder) depending on the file type
 *       404:
 *          description: The resource does not exist on the filesystem
 *
 */

 /**
 * @swagger
 *
 * /LatestProjects:
 *   get:
 *     summary: get latest projects
 *     description: Get a response for the latest projects
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: The response with latest projects and stats array, proxying fs.readFile() - [{title, tags, links},{...newFileData}]
 *       404:
 *          description: The resource does not exist on the filesystem
 *
 */
app.get("/GetFile", readOperations);
app.get("/LatestProjects", readOperations);
app.get("/*", readOperations);

// Mount the app
app.listen(port, host);
https.createServer(corsOptions, app).listen(5757);
export default app;
