const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), (req, res) => {
    const tempPath = req.file.path;
    const targetPath = path.join("uploads", "latest.csv");

    fs.renameSync(tempPath, targetPath);
    res.json({ message: "File uploaded" });
});

module.exports = router;