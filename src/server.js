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
 *         content: application/json
 *         schema:
 *           type: object
 *           example: { id: "print2a", name: "print2a", mode: "755", size: "0", sizeHuman: "0 B", username: "root", isDir: true, birthtime: "2020-01-01T00:00:00.000Z", mtime: "2020-01-01T00:00:00.000Z", childrenCount: 0, path: "/mnt/volume_sfo2_01/repo" }
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
 *     description: Get a response for an existing files data depending on the file type (image, text, model, folder) <br /><br /> the api will supply either a base64 image, a plaintext model, a text file or a zip file
 *     produces:
 *       - application/json
 *       - text/plain
 *       - application/zip
 *       - image/png
 *       - image/jpeg
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
 *         content: application/json
 *         schema:
 *          type: array
 *          example: [{"title":"Latest Repo Statistics","tags":"Total Projects: 1299\nProject Files: 19325\nTotal Files: 26992\nTotal Repo Size: 67.8 GB","link":"#"},{{id: "print2a",name: "print2a",mode: "755",size: "0",sizeHuman: "0 B",username: "root",isDir: true,birthtime: "2020-01-01T00:00:00.000Z",mtime: "2020-01-01T00:00:00.000Z",childrenCount: 0,path: "/mnt/volume_sfo2_01/repo"}}]
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
