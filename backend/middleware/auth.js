import jwt from "jsonwebtoken";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res.status(401).json({
        error: "No access token",
      });
    }
    const access_token = authHeader.split(" ")[1];

    jwt.verify(access_token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({
          error: "Invalid token",
        });
      }
      req.user = user;
      next();
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default auth;