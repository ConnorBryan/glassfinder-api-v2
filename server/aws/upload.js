const fs = require('fs');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

AWS.config.loadFromPath('server/aws/config.json');

const region = 'us-west-1';
const bucket = 'glassfinder-pieces';
const s3 = new AWS.S3({ region });

module.exports = multer({
  storage: multerS3({
    s3,
    bucket,
    metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (req, file, cb) => cb(null, Date.now().toString()),
  }),
});