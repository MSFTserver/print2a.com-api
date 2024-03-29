import { promises as fs } from "fs";
import zipFolder from "zip-folder";
import path from "path";
import { marked } from 'marked';
import { getUserName, modeToOctal, sizeToHuman } from "./util.js";

export default async (req, res) => {
  // The default starting path is the directory from which server is executed.
  // Otherwise, get the full path keyed under unnamed Express parameter '0'.
  const print2aApiUrl = "https://api.print2a.com";
  const mainPath = "/mnt/print2a-volume";
  const latestPath = "../print2a.com-stats/latest.json";
  const dlFolderName = "DLZIP";
  const repoPath = `${mainPath}/repo`;
  const dlPath = `${mainPath}/${dlFolderName}`;
  let requestedPath = repoPath;

  // getDirectories
  //
  // read directory from given path.
  // returns children folders and files.
  // https://nodejs.org/api/fs.html#fs_fs_readdir_path_callback
  const getDirectories = async source => {
    let children = await fs.readdir(source, { withFileTypes: true });
    return children.map(dirent => source + "/" + dirent.name);
  };

  // handleDirectoryRequest
  //
  // See the async stat() docs for more response options.
  // Note we're using the Node.js fs_promises not regular synchronous `fs`.
  // https://nodejs.org/api/fs.html#fs_fs_promises_api
  const handleDirectoryRequest = async () => {
    const dirEntries = await fs.readdir(requestedPath);
    const nodes = await Promise.all(
      dirEntries.map(async node => {
        const path = `${requestedPath}/${node}`;
        const nodeStats = await fs.stat(path);
        let childrenCount = 0;
        if (nodeStats.isDirectory()) {
          const children = await getDirectories(path);
          childrenCount = children.length;
        }
        return {
          id: path.replace("//","/").replace(`${repoPath}/`, ""),
          name: node,
          mode: modeToOctal(nodeStats.mode),
          size: nodeStats.size,
          sizeHuman: nodeStats.size ? sizeToHuman(nodeStats.size) : "0 B",
          username: getUserName(nodeStats.uid),
          isDir: nodeStats.isDirectory(),
          birthtime: nodeStats.birthtime,
          mtime: nodeStats.mtime,
          childrenCount: childrenCount,
          path: requestedPath
        };
      })
    );

    res.json(nodes);
  };

  // handleFileRequest
  //
  // Return a single file, define filename in Content-Disposition header
  // https://expressjs.com/en/api.html#res.download
  const handleFileRequest = async () => {
    const fileName = path.basename(requestedPath);
    const fileExt = fileName.split(".").pop();
    res.download(requestedPath, fileName);
  };

  // handleFolderRequest
  //
  // Return zipped up folder, define foldername in Content-Disposition header
  // https://expressjs.com/en/api.html#res.download
  const handleFolderRequest = async () => {
    const folderName = path.basename(requestedPath);
    console.log(folderName)
    console.log(`${repoPath}/${req.params[0]}`);
    let folderContents = await fs.readdir(dlPath)
    console.log(folderContents.includes(`${req.params[0].replace(/\//g,"+")}.zip`))
    if (!folderContents.includes(`${req.params[0].replace(/\//g,"+")}.zip`)) {
      zipFolder(`${repoPath}/${req.params[0]}`, `${dlPath}/${req.params[0].replace(/\//g,"+")}.zip`, function(err) {
          if(err) {
              console.log('oh no!', err);
              res.json({status:`ERROR`,msg: err})
          } else {
              res.json({
                status:`COMPLETE`,
                link:`${print2aApiUrl}/${dlFolderName}/${req.params[0].replace(/\//g,"+")}.zip`,
                fileName: `${req.params[0].replace(/\//g,"+")}.zip`
              })
          }
      });
    } else {
      res.json({
        status:`COMPLETE`,
        link:`${print2aApiUrl}/${dlFolderName}/${req.params[0].replace(/\//g,"+")}.zip`,
        fileName: `${req.params[0].replace(/\//g,"+")}.zip`
      })
    }
  };

  // handleLatestRequest
  //
  // Return latest.json file
  // https://nodejs.org/api/fs.html#filehandlereadfileoptions
  const handleLatestRequest = async () => {
    const latestProjects = await fs.readFile(requestedPath);
    res.json(JSON.parse(latestProjects));
  }

  // handleGetFile 
  //
  // Return a single files data, define fileLocation in request paramerter
  // https://expressjs.com/en/api.html#res.send
  const handleGetFile = async (serveFile) => {
    if (serveFile) {
      const filePath = req.query.fileLocation;
      const fileName = req.query.fileLocation.split("/").pop();
      const fileExt = fileName.split(".").pop();
      const fileContent = await fs.readFile(
        `${repoPath}/${filePath}`
      );
      res.set('Content-Type', 'text/plain');
      if (['pdf','png', 'jpg'].includes(fileExt.toLowerCase())) {
        res.send(fileContent.toString('base64'));
      } else if (fileExt.toLowerCase() === 'stl') {
        res.set('Contnet-Type', 'application/json');
        res.send(fileContent);
      } else if (fileExt.toLowerCase() === 'obj') {
        res.send(fileContent.toString());
      } else {
        res.send(fileContent.toString());
      }
    } else {
      res.status(404).send("Stop Trying to Hack my Shit you Pleb script kitty!")
    }
  }

  // handleGetObjectBuffer
  //
  // Check if the path is accessible.
  // Then return the directory, file or 404.
  // https://nodejs.org/api/fs.html#fs_fs_accesssync_path_mode
  // https://nodejs.org/api/fs.html#fs_fs_statsync_path
  const handleChonkyActions = async () => {
      fs.access(requestedPath).then(async () => {
        const requestStats = await fs.stat(requestedPath);
        const isRequestingDirectory = requestStats.isDirectory();
        const isRequestingFolder = req.headers.request;
        if (isRequestingDirectory && !isRequestingFolder) {
          // gets the requested directory to navigate Chonky
          handleDirectoryRequest();
        } else if (!isRequestingDirectory && !isRequestingFolder) {
          // gets the requested file download
          handleFileRequest();
        } else if (isRequestingDirectory && isRequestingFolder){
          // gets the requested folder download as .zip
          handleFolderRequest();
        }
      })
      .catch(() => {
        res.status(404).send("404 Not found<br>"+requestedPath);
      });
  };

  // determine what endpoint to handle
  let serveFile = true;
  if (req.params[0]) {
    console.log(req.params[0])
    if (req.params[0] === 'GetFile') {
      let urlParams = req.query;
      if (
        urlParams.fileLocation.includes("../") ||
        urlParams.fileLocation.startsWith("./") ||
        urlParams.fileLocation.startsWith("~/")
        ) {
        serveFile = false;
      }
    } else if (!req.params[0].includes('../')) {
      requestedPath = `${repoPath}/${req.params[0]}`;
    }
  };
  if (req.url.startsWith(`/${dlFolderName}`)){
    requestedPath = `${mainPath}/${req.params[0].replace(/\//g,"+").replace("+","/")}`;
    handleChonkyActions();
  } else if (req.url.startsWith("/LatestProjects")){
    requestedPath = latestPath;
    handleLatestRequest();
  } else if (req.url.startsWith("/GetFile")){
    requestedPath = `${repoPath}/${req.params[0]}`;
    handleGetFile(serveFile);
  } else {
    handleChonkyActions();
  }
}