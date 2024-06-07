const fs = require('fs');
const { load } = require("js-yaml");

const msg = load(fs.readFileSync(__dirname + '/messages.yaml', 'utf8'));

module.exports = {
  success: msg.success, error: msg.error
};