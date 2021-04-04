import { promises as fs } from "fs";
import zipFolder from "zip-folder";
import path from "path";
import { getUserName, modeToOctal, sizeToHuman } from "./util.js";

export default async (req, res) => {
  // The default starting path is the directory from which server is executed.
  // Otherwise, get the full path keyed under unnamed Express parameter '0'.
  const print2aApiUrl = "https://print2a.com:5757"
  let requestedPath = `../../repo/${req.params[0]}` || `../../repo/`;
  if (req.url.startsWith("/DLZIP")){
    requestedPath = `../../${req.params[0].replace(/\//g,"+").replace("+","/")}`
  } else if (req.url.startsWith("/LatestProjects")){
    requestedPath = `../print2a.com-stats/latest.json`
  }
  // getDirectories
  //
  // read directory from given path.
  // returns children folders and files.
  //

  const getDirectories = async source => {
    let children = await fs.readdir(source, { withFileTypes: true });
    return children.map(dirent => source + "/" + dirent.name);
  };

  // handleDirectoryRequest
  //
  // See the async stat() docs for more response options.
  // Note we're using the Node.js fs_promises not regular synchronous `fs`.
  // https://nodejs.org/api/fs.html#fs_fs_promises_api
  //

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
          id: path.replace("//","/").replace("../../repo/", ""),
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
    res.download(requestedPath, fileName);
  };

  // handleFolderRequest
  //
  // Return zipped up folder, define foldername in Content-Disposition header
  // https://expressjs.com/en/api.html#res.download
  const handleFolderRequest = async () => {
    const folderName = path.basename(requestedPath);
    console.log(folderName)
    console.log(`../../repo/${req.params[0]}`);
    let folderContents = await fs.readdir(`../../DLZIP/`)
    console.log(folderContents.includes(`${req.params[0].replace(/\//g,"+")}.zip`))
    if (!folderContents.includes(`${req.params[0].replace(/\//g,"+")}.zip`)) {
      zipFolder(`../../repo/${req.params[0]}`, `../../DLZIP/${req.params[0].replace(/\//g,"+")}.zip`, function(err) {
          if(err) {
              console.log('oh no!', err);
              res.json({status:`ERROR`,msg: err})
          } else {
              res.json({
                status:`COMPLETE`,
                link:`${print2aApiUrl}/DLZIP/${req.params[0].replace(/\//g,"+")}.zip`,
                fileName: `${req.params[0].replace(/\//g,"+")}.zip`
              })
          }
      });
    } else {
      res.json({
        status:`COMPLETE`,
        link:`${print2aApiUrl}/DLZIP/${req.params[0].replace(/\//g,"+")}.zip`,
        fileName: `${req.params[0].replace(/\//g,"+")}.zip`
      })
    }
  };

  const handleLatestRequest = async () => {
    const latestProjects = fs.readFileSync(requestedPath);
    res.json(latestProjects);
  }

  // Check if the path is accessible.
  // Then return the directory, file or 404.
  //
  fs.access(requestedPath)
    .then(async () => {
      const requestStats = await fs.stat(requestedPath);
      const isRequestingDirectory = requestStats.isDirectory();
      const isRequestingFolder = req.headers.request;
      if (requestedPath == "/LatestProjects") {
        handleLatestRequest();
      } else if (isRequestingDirectory && !isRequestingFolder) {
        handleDirectoryRequest();
      } else if (!isRequestingDirectory && !isRequestingFolder) {
        handleFileRequest();
      } else if (isRequestingDirectory && isRequestingFolder){
        handleFolderRequest()
      }
    })
    .catch(() => {
      res.status(404).send("404 Not found<br>"+requestedPath)
    });
};
