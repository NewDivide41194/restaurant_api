const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('security/private.key');
const publicKey = fs.readFileSync('security/public.pem');

const produceToken = (payload) => {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: "1d" });
}

const verifyToken = (token, callback) => {
    jwt.verify(token, publicKey, (err, res) => {
        if (err) callback(err, null)
        else callback(null, res)
    })
}
module.exports.produceToken = produceToken;
module.exports.verifyToken = verifyToken;                                  