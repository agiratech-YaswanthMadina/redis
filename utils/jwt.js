const jwt = require('jsonwebtoken');

const secretKey = 'hjdabcjhbcsdajckb465d4c6sd4scsds'; 

function generateToken(user) {
  const payload = {
    id: user.id,
    name: user.displayName,
    googleId: user.googleId,
    email: user?.email
  };

  return jwt.sign(payload, secretKey, { expiresIn: '1h' }); 
}

module.exports = generateToken;
