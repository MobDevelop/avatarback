var express = require("express");
const fs = require("fs"); //Handle files
const path = require("path");
var router = express.Router();
var mime = require("mime-types");
const uploadFile = require("./upload.js");
const fileType = require("file-type");
const multiparty = require("multiparty");
/* GET home page. */
router.get("/", function(req, res, next) {
  const query = "select * from users";
  db.query(query, (err, result) => {
    if (err) {
      console.log("Error occured while running the query");
    }
    console.log(result);
  });
  res.render("index", { title: "Express" });
});

router.get("/downPly", function(req, res, next) {
  //console.log(req.query.location);
  const spawn = require("child_process").spawn;
  const pythonProcess = spawn("python", [
    "./AvatarTest.py",
    req.query.location
  ]);
  pythonProcess.stdout.on("data", async data => {
    try {
      let filePath = path.join(
        __dirname,
        "../" + data.toString() + "/model.ply"
      );
      console.log("start uploading");
      let buffer = fs.readFileSync(filePath);
      let returnedData = await uploadFile("plyPath", buffer, data, {
        ext: "ply",
        mime: "ply"
      });
      console.log("ply file uploaded");
      filePath = path.join(__dirname, "../" + data.toString() + "/model.jpg");
      buffer = fs.readFileSync(filePath);
      returnedData = await uploadFile("plyPath", buffer, data, {
        ext: "jpg",
        mime: "image/jpeg"
      });
      console.log("jpg file uploaded");
      const query =
        "update users set plyPath = '" +
        returnedData.Location.split(".jpg")[0] +
        "' where username = '" +
        req.query.username +
        "'";
      db.query(query, (err, result) => {
        if (err) {
          console.log("Error occured while running the query");
        }
        console.log(result);
      });
      console.log("db updated");
      return res.status(200).send(returnedData);
    } catch (e) {
      console.log(e);
      return res.status(400).send(e);
    }
  });
  pythonProcess.stderr.on("error", data => {
    console.log("error");
    console.log("error", data);
  });
  pythonProcess.on("close", data => {
    console.log(data);
    console.log(`child process close with ${data}`);
  });
});

router.post("/signup", function(req, res, next) {
  let query = "select * from users where username = ?";
  db.query(query, req.body.username, function(err, result) {
    if (result) {
      let data = {};
      if (result.length > 0) {
        data.status = "Username exists, please type another username";
        data.code = 1;
        return res.status(200).send(data);
      } else {
        query =
          "insert into users(firstname,lastname,username,emailaddress,mobilephone,password) values(?,?,?,?,?,?)";
        db.query(
          query,
          [
            req.body.firstname,
            req.body.lastname,
            req.body.username,
            req.body.emailaddress,
            req.body.mobilephone,
            req.body.password
          ],
          function(err, result) {
            if (result) {
              data.status = "Signup success";
              data.code = 2;
              return res.status(200).send(data);
            }
          }
        );
      }
    }
  });
});

router.post("/login", function(req, res, next) {
  let query =
    "select * from users where users.username = ? and users.password = ?";
  db.query(query, [req.body.username, req.body.password], function(
    err,
    result
  ) {
    if (err) {
      console.log(err);
    }
    if (result) {
      let data = {};
      if (result.length < 1) {
        data["status"] = "Please type correct username and password!";
        data["code"] = 1;
        return res.status(200).send(data);
      }
      data["status"] = "Login success!";
      data["code"] = 2;
      data["data"] = result[0];
      return res.status(200).send(data);
    }
  });
});

router.post("/uploadImage", function(req, res, next) {
  const form = new multiparty.Form();
  form.parse(req, async (error, fields, files) => {
    if (error) throw new Error(error);
    try {
      const path = files.file[0].path;
      const buffer = fs.readFileSync(path);
      const type = fileType(buffer);
      const data = await uploadFile("images", buffer, fields.user[0], type);
      const query =
        "update users set originalImagePath = '" +
        data.Location +
        "' where username = '" +
        fields.user[0] +
        "'";
      db.query(query, (err, result) => {
        if (err) {
          console.log("Error occured while running the query");
        }
        console.log(result);
      });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).send(error);
    }
  });
});

router.get("/getAllUsers", function(req, res, next) {
  const query = "select *from users where role = 0";
  try {
    db.query(query, (err, result) => {
      if (err) {
        console.log(err);
      }
      console.log(result);
      return res.status(200).send(result);
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }
});

module.exports = router;
