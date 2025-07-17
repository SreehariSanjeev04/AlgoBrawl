const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: "User created", user: newUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({
        error: "Please fill all the details",
      });
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { username, id: user.id, rating: user.rating },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      { username, id: user.id, rating: user.rating },
      process.env.REFRESH_TOKEN,
      {
        expiresIn: "30d",
      }
    );

    res.cookie("refresh-token", refreshToken, COOKIE_OPTIONS);
    return res.status(200).json({ user, accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const user = await User.findByPk(id, {
      attributes: {
        exclude: ["password"],
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/validate", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const access_token = authHeader.split(" ")[1];
    if (!access_token) {
      res.status(401).json({ error: "No access token" });
    }
    jwt.verify(access_token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(401).json({ error: "Unauthorized Access" });
      res.status(200).json(user);
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    const authHeader = req.headers["authorization"];

    const access_token = authHeader.split(" ")[1];

    if (!access_token || !refresh_token) {
      return res.status(401).json({
        error: "Kindly login again",
      });
    }

    const playload = jwt.verify(access_token, process.env.JWT_SECRET);

    const newAccessToken = jwt.sign(
      {
        id: playload.id,
        username: playload.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    res.status(200).json({
      accessToken: newAccessToken,
      user: {
        username: playload.username,
      },
    });
  } catch (err) {}
});

router.put("/update-score", async (req, res) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: "Invalid Secret" });
  }

  const { user_id, new_score } = req.body;

  if (
    typeof user_id !== "number" ||
    typeof new_score !== "number" ||
    !Number.isInteger(user_id)
  ) {
    return res.status(400).json({ error: "Invalid user_id or score" });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.rating = new_score;
    await user.save();

    return res.json({ message: "User score updated successfully", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
