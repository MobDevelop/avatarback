const AWS = require("aws-sdk");
const bluebird = require("bluebird");

const AWS_ACCESS_KEY_ID = "AKIAXZCXEOE56RVNISZL";
const AWS_SECRET_ACCESS_KEY = "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";
const S3_BUCKET = "avatar3d/";

// configure the keys for accessing AWS
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY
});

// configure AWS to work with promises
AWS.config.setPromisesDependency(bluebird);

// create S3 instance
const s3 = new AWS.S3();

const uploadFile = (folder, buffer, name, type) => {
  const params = {
    ACL: "public-read",
    Body: buffer,
    Bucket: S3_BUCKET + folder,
    ContentType: type.mime,
    Key: `${name}.${type.ext}`
  };
  console.log(name, type);
  return s3.upload(params).promise();
};
module.exports = uploadFile;
