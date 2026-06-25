const fs = require('fs');
const path = require('path');

function getPatentsData() {
  const configPath = path.join(__dirname, '..', 'config', 'patents.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const data = JSON.parse(raw);
  const items = data.items || [];
  const granted = items.filter((p) => p.status === 'Granted');
  const filed = items.filter((p) => p.status !== 'Granted');
  const sorted = [
    ...granted.sort((a, b) => new Date(b.grantedDate || b.filedDate) - new Date(a.grantedDate || a.filedDate)),
    ...filed.sort((a, b) => new Date(b.filedDate) - new Date(a.filedDate)),
  ];

  return {
    ...data,
    items: sorted,
    count: items.length,
    grantedCount: granted.length,
    filedCount: filed.length,
    featured: granted.filter((p) => p.featured),
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = { getPatentsData };
