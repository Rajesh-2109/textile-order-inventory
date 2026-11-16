const fs = require("fs");
const path = require("path");

// delete an uploaded file by its stored name (basename only, no path tricks)
module.exports = (filename) => {
  if (!filename) return;
  const file = path.join(__dirname, "..", "uploads", path.basename(String(filename)));
  fs.unlink(file, () => {});
};
