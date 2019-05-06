var express = require("express");
var router = express.Router();
const fs = require("fs");
const fileType = require("file-type");
const multiparty = require("multiparty");
const uploadFile = require("./upload.js");

/* GET users listing. */
router.get("/", function(req, res, next) {
  res.send("respond with a resource");
});

router.post("/", function(req, res, next) {
  const form = new multiparty.Form();
  form.parse(req, async (error, fields, files) => {
    if (error) throw new Error(error);
    try {
      const path = files.file[0].path;
      const buffer = fs.readFileSync(path);
      const type = fileType(buffer);
      const fileName = files.file[0].originalFilename.split(".")[0];
      const data = await uploadFile("images", buffer, fileName, type);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).send(error);
    }
  });
});

module.exports = router;
