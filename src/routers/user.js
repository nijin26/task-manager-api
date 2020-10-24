const express = require("express");
const multer = require("multer");
const sharp = require('sharp')
const {sendWelcomeEmail,sendDeleteMail} = require('../emails/account')
const User = require("../models/user");
const auth = require("../middleware/auth");

const app = new express.Router();

app.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email,user.name)
    const token = await user.generateAuthToken();
    res.status(201).send({ token, user });
  } catch (e) {
    res.status(400).send(e);
  }
});

app.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an Image."));
    }
    cb(undefined, true);
  },
});

app.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

app.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  try {
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(400).send();
  }
});

app.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(400).send();
  }
});

app.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

app.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

app.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

app.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send({ error: "Invalid Updates" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

app.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendDeleteMail(req.user.email,req.user.name)
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = app;
