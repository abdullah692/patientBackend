require("dotenv").config();
const AWS = require("aws-sdk");


const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretKey = process.env.AWS_SECRET_KEY;

const S3 = new AWS.S3({
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
});

const uploadImage = async (file, fileName) => {
      await S3.putObject({
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer
      }, (err, data) => {
        if (err) {
          console.error('Error Uploading Files', err);
        } 
        else {
            console.log('Uploaded successfully');
        }
      }).promise();
    return true;
}

const deleteImage = async (fileKey) => {
  await S3.deleteObject({
    Bucket: bucketName,
    Key: fileKey,
  }, (err, data) => {
    if (err) {
      console.error('Error Uploading Files', err);
    } 
    else {
        console.log('Deleted successfully');
    }
  }).promise();
return true;
}

function getFileStream(fileKey) {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName
    }
    return S3.getObject(downloadParams).createReadStream()
}

module.exports = {
  uploadImage,
  getFileStream,
  deleteImage
}