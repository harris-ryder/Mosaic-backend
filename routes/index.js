var express = require("express");
var router = express.Router();
var Replicate = require("replicate");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const replicate = new Replicate({
  auth: "r8_3fcvc4mCSThyda6PqoiCzEv8H26Ex4810CT9y",
  userAgent: "https://www.npmjs.com/package/create-replicate",
});


//LOGIN TO CREATE A ACCESS TOKEN
router.post("/login", function (req, res, next) {
  console.log("working");

  const { username, password, time } = req.body;

  console.log("username:", username);
  console.log("password", password);
  console.log("time", time);
  if (username !== process.env.USERNAME || password !== process.env.PASSWORD) {
    return res.status(403).json({ error: "Invalid login" });
  }

  const user = { username };

  const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: time });

  res.json({ token: token });
});


//TOKEN CHECKER
router.get("/check", authenticateToken, function (req, res, next) {
  return res.json({ success: "yeah" });
});

//AUTHENTICATE MIDDLEWARE
function authenticateToken(req, res, next) {
  const authHeader = req.headers[`authorization`];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

//RENDER ROUTE
router.post("/render", authenticateToken, async function (req, res, next) {
  const { images, prompt } = req.body;

  try {
    let output;
    switch (images.length) {
      case 1:
        // Call function for 1 image
        output = await handleSingleImage(images, prompt);
        break;
      case 2:
        // Call function for 2 images
        output = await handleTwoImages(images, prompt);
        break;
      case 3:
        // Call function for 3 images
        output = await handleThreeImages(images, prompt);
        break;
      case 4:
        // Call function for 3 images
        output = await handleThreeImages(images, prompt);
        break;
      default:
        return res.status(400).json({ error: "Unsupported number of images" });
    }
    res.json({ imgUrl: output });
  } catch (error) {
    console.error("Error processing images:", error);
    res.status(500).send("Error processing request");
  }
});


//FUNCTIONS TO HAND REPLICATE API
async function handleSingleImage(images, prompt) {
  console.log("image: 1");
  // Logic for handling a single image
  const input = {
    style_image: images[0].url,
    prompt: prompt,
  };
  return await replicate.run(
    "fofr/style-transfer:4f8304d9f7742fdacc13bf618f0984040cc6d765e0f7f94133db835a1893ff75",
    { input }
  );
}

async function handleTwoImages(images, prompt) {
  console.log("image: 2");
  // Logic for handling two images
  const input = {
    prompt: prompt,
    image_1: images[0].url,
    image_2: images[1].url,
    merge_strength: 0.92,
    added_merge_noise: 0,
  };
  return await replicate.run(
    "fofr/image-merge-sdxl:5fd9159399134ae0dd7b06bbbaabe7e7c15dbfec8b038eddef2ca3aa03355620",
    { input }
  );
}

async function handleThreeImages(images, prompt) {
  console.log("image: 3 or 4");
  // Logic for handling three images
  const input = {
    prompt: prompt,
    image_1: images[0].url,
    image_2: images[1].url,
    control_image: images[2].url,
    merge_mode: "left_right",
    upscale_2x: true,
    negative_prompt: "garish, soft, ugly, broken, distorted",
  };
  return await replicate.run(
    "fofr/image-merger:db2c826b6a7215fd31695acb73b5b2c91a077f88a2a264c003745e62901e2867",
    { input }
  );
}

module.exports = router;
