const jwt = require('jsonwebtoken');

const secretKey = 'hjdabcjhbcsdajckb465d4c6sd4scsds'; // Use a strong, unique secret key in production

function generateToken(user) {
  const payload = {
    id: user.id,
    name: user.displayName,
    googleId: user.googleId
  };

  return jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Token valid for 1 hour
}

module.exports = generateToken;
