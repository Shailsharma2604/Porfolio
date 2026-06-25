const fs = require('fs');
const path = require('path');

function getSocialConfig() {
  const configPath = path.join(__dirname, '..', 'config', 'social.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

module.exports = { getSocialConfig };
