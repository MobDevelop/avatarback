var express = require("express");
const fs = require("fs"); //Handle files
const path = require("path");
var router = express.Router();
var mime = require("mime-types");
const uploadFile = require("./upload.js");
const fileType = require("file-type");
const multiparty = require("multiparty");
let archiver = require("archiver");

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
});

router.post("/signup", function(req, res, next) {
  let query = "select * from users where username = ?";
  console.log("signup");
  try {
    db.query(query, req.body.username, function(err, result) {
      if (result) {
        let data = {};
        if (err) {
          console.log(err);
          return res.status(400).send(err);
        }
        console.log(result);
        if (result.length > 0) {
          data.status = "Username exists, please type another username";
          data.code = 1;
          return res.status(200).send(data);
        } else {
          query =
            "insert into users(firstname,lastname,username,emailaddress,mobilephone,password,originalImagePath,plyPath,role) values(?,?,?,?,?,?,'','',0)";
          console.log(query);
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
              if (err) {
                res.status(400).send(err);
              }
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
  } catch (e) {
    return res.status(400).send(e);
  }
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
      const fPath = files.file[0].path;
      const buffer = fs.readFileSync(fPath);
      const type = fileType(buffer);
      const uploadData = await uploadFile(
        "images",
        buffer,
        fields.user[0],
        type
      );
      console.log(uploadData.Location);
      const spawn = require("child_process").spawn;
      const pythonProcess = spawn("python", [
        "./AvatarTest.py",
        uploadData.Location
      ]);
      pythonProcess.stdout.on("data", async data => {
        try {
          console.log(data.toString());
          //archive zip
          var output = fs.createWriteStream(data.toString() + ".zip");
          var archive = archiver("zip");
          output.on("close", async function() {
            console.log(archive.pointer() + " total bytes");
            console.log(
              "archiver has been finalized and the output file descriptor has closed."
            );
            console.log("zip file uploading");
            let filePath = path.join(
              __dirname,
              "../" + data.toString() + ".zip"
            );
            let zipBuffer = fs.readFileSync(filePath);
            returnedData = await uploadFile("zip", zipBuffer, data.toString(), {
              ext: "zip",
              mime: "application/zip"
            });
            const query =
              "update users set plyPath = '" +
              returnedData.Location +
              "',originalImagePath = '" +
              uploadData.Location +
              "' where username = '" +
              fields.user[0] +
              "'";
            db.query(query, (err, result) => {
              if (err) {
                console.log("Error occured while running the query");
              }
              console.log(result);
            });
            console.log("db updated");
            let rData = {};
            rData.imagePath = uploadData.Location;
            rData.plyPath = returnedData.Location;
            return res.status(200).send(rData);
          });
          archive.on("error", function(err) {
            console.log(err);
            res.status(400).send(err);
            throw err;
          });
          archive.pipe(output);
          let file = fs.createReadStream(
            path.join(__dirname, "/../" + data.toString() + "/model.ply")
          );
          archive.append(file, { name: "model.ply" });
          file = fs.createReadStream(
            path.join(__dirname, "/../" + data.toString() + "/model.jpg")
          );
          archive.append(file, { name: "model.jpg" });
          archive.finalize();
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

      //return res.status(200).send(data);
    } catch (error) {
      console.log(error);
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
