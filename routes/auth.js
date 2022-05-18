const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");
const requireLogin = require("../middleware/requireLogin");
const { SENDGRID_API } = require("../config/keys");
const { EMAIL } = require("../config/keys");

// from here it is the code for the mails
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  //api key of the sendgrid is here
  sendgridTransport({
    auth: {
      api_key: SENDGRID_API,
    },
  })
);

// till here it is of the mail

// router.get("/", (req, res) => {
//   res.send("hello");
// });
// protected one is just for testing
// router.get("/protected", requireLogin, (req, res) => {
//   res.send("Hello User");
// });
router.post("/signup", (req, res) => {
  //   console.log(req.body.name);
  const { name, email, password, pic } = req.body;
  if (!email || !password || !name) {
    return res.status(422).json({ error: "please add all the fields" });
  }
  //   res.send({ message: "successfully posted" });
  User.findOne({ email: email })
    .then((savedUser) => {
      if (savedUser) {
        return res
          .status(422)
          .json({ error: "user already exists with that email" });
      }
      bcrypt.hash(password, 12).then((hashedpassword) => {
        const user = new User({
          email,
          password: hashedpassword,
          name,
          pic: pic,
        });
        user
          .save()
          .then((user) => {
            // it is also of the mail
            transporter.sendMail({
              to: user.email,
              from: "dhawaltiwari451@gmail.com",
              subject: "Signup success",
              html: "<h1>Welcome to the friends circle</h1>",
            });
            //till here it is of the mail
            res.json({ message: "saved successfully" });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ error: "please add all the fields" });
  }
  User.findOne({ email: email }).then((savedUser) => {
    if (!savedUser) {
      return res.status(422).json({ error: "Invalid email or password" });
    }
    bcrypt
      .compare(password, savedUser.password)
      .then((doMatch) => {
        if (doMatch) {
          //   res.json({ message: "sucessfully signed in" });
          const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET);
          const { _id, name, email, followers, following, pic } = savedUser;
          res.json({
            token,
            user: { _id, name, email, followers, following, pic },
          });
        } else {
          return res.status(422).json({ error: "Invalid email or password" });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

router.post("/reset-password", (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email }).then((user) => {
      if (!user) {
        return res
          .status(422)
          .json({ error: "user dont exist with that email" });
      }
      user.resetToken = token;
      user.expireToken = Date.now() + 3600000;
      user.save().then((result) => {
        transporter.sendMail({
          to: user.email,
          from: "dhawaltiwari451@gmail.com",
          subject: "password-reset",
          html: `
          <p>You are requested for password reset</p>
          <h5>click on this <a href= "${EMAIL}/reset/${token}">link</a>to reset the password</h5>
          `,
        });
        res.json({ message: "Check your email" });
      });
    });
  });
});
router.post("/new-password", (req, res) => {
  const newPassword = req.body.password;
  const sentToken = req.body.token;
  User.findOne({
    resetToken: sentToken,
    expireToken: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        return res.status(422).json({ error: "Try again session expired" });
      }
      bcrypt.hash(newPassword, 12).then((hashedpassword) => {
        user.password = hashedpassword;
        user.resetToken = undefined;
        user.expireToken = undefined;
        user.save().then((saveduser) => {
          res.json({ message: "password updated successfully" });
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
module.exports = router;
