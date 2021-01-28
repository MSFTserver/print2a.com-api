import os from "os";

// getUserName
//
export const getUserName = uid => {
  const currentUser = os.userInfo();
  // Unclear if it is possible to look up arbitrary file owners on the OS by id. Fallback to uid.
  // — @christopher 2020 June 10
  return uid === currentUser.uid ? currentUser.username : uid;
};

// modeToOctal
//
// From https://www.martin-brennan.com/nodejs-file-permissions-fstat/
export const modeToOctal = mode =>
  "0" + (mode & parseInt("777", 8)).toString(8);

// sizeToHuman
//
// From https://gist.github.com/narainsagar/5cfd315ab38ba363191b63f8ae8b27db
export const sizeToHuman = size => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(2) * 1 +
    " " +
    ["B", "KB", "MB", "GB", "TB"][i]
  );
};
