const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Project = require('../models/project')

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

router.use(
  require("express-session")({
    secret: "cats",
    resave: false,
    saveUninitialized: true,
  })
);

router.use(passport.initialize());
router.use(passport.session());

router.get("/", (req, res) => {
  res.send(
    '<center><a href="/auth/google">Authenticate with Google</a></center>'
  );
});

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure",
  }),
  async (req, res) => {
    try {
      // Adding user to the database
      // console.log(req.user);
      let user = await User.findOne({ email: req.user.email });

      if (!user) {
        user = new User({
          name: req.user.displayName,
          email: req.user.emails[0].value,
          googleId: req.user.id,
        });
        await user.save();
      }
      res.redirect("/protected");
    } catch (error) {
      console.error("Error adding user:", error);
      res.redirect("/auth/google/failure");
    }
  }
);

router.get("/protected", isLoggedIn, async (req, res) => {
  // res.send(`Hello ${req.user.displayName}`);
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).send('Error retrieving project data');
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("Goodbye!");
});

router.get("/auth/google/failure", (req, res) => {
  res.send("Failed to authenticate..");
});

module.exports = router;

