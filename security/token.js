const jwt = require("jsonwebtoken");
const fs = require("fs");
const privateKey = fs.readFileSync("security/private.key");
const publicKey = fs.readFileSync("security/public.pem");

const produceToken = payload => {
  return jwt.sign(payload, privateKey, { expiresIn: "1d" });
};

const verifyToken = (req, res, next) => {
  const header = req.headers["authorization"];

  if (typeof header !== "undefined") {
    const bearer = header.split(" ");
    const token = bearer[1];

    req.token = token;
    next();
  } else {
    res.sendStatus(403);
  }
};
module.exports.produceToken = produceToken;
module.exports.verifyToken = verifyToken;
