import { promises as fs } from "fs";
import path from "path";
import { getUserName, modeToOctal, sizeToHuman } from "./util.js";

export default async (req, res) => {
  // The default starting path is the directory from which server is executed.
  // Otherwise, get the full path keyed under unnamed Express parameter '0'.
  const requestedFilePath =
    "../repo/" + req.params["0"] || "../repo/";

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
    const dirEntries = await fs.readdir(requestedFilePath);
    const nodes = await Promise.all(
      dirEntries.map(async node => {
        const path = `${requestedFilePath}/${node}`;
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
          path: requestedFilePath
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
    const fileName = path.basename(requestedFilePath);
    res.download(requestedFilePath, fileName);
  };

  // Check if the path is accessible.
  // Then return the directory, file or 404.
  //
  fs.access(requestedFilePath)
    .then(async () => {
      const requestStats = await fs.stat(requestedFilePath);
      const isRequestingDirectory = requestStats.isDirectory();
      if (isRequestingDirectory) {
        handleDirectoryRequest();
      } else {
        handleFileRequest();
      }
    })
    .catch(() => {
      res.status(404).send("404 Not found<br>"+requestedFilePath)
    });
};
