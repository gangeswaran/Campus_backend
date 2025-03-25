const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "my_file",
  api_key: "276994964888779",
  api_secret: "s_0DhWq60Z9Is7pIG4T7seDBxNk",
});

module.exports = cloudinary;
