const fs = require('node:fs'), p = require('node:path'), root = p.resolve(__dirname, '..'), data = {};
for (const f of fs.readdirSync(p.join(root, 'data')).filter(f => f.endsWith('.json'))) data[f.slice(0, -5)] = JSON.parse(fs.readFileSync(p.join(root, 'data', f), 'utf8'));
// Keep the legacy Site list in sync; edit radius-sites.json as the source.
data.sites = data['radius-sites'].sites.map(({ id, name }) => ({ id, name }));
fs.writeFileSync(p.join(root, 'data/sites.json'), JSON.stringify(data.sites, null, 2) + '\n');
fs.writeFileSync(p.join(root, 'js/offline-data.js'), 'window.NT_DATA = ' + JSON.stringify(data, null, 2) + ';');
