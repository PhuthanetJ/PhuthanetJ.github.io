const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const root = path.resolve(__dirname, '..');
const expected = [
  ['dashboard','Dashboard'],
  ['radius','RADIUS & Policy'],
  ['builder','Portal Configuration'],
  ['voucher','Free WiFi & Coupon'],
  ['access','Network Configuration'],
  ['ap-sites','AP by Site'],
  ['reports','Reports'],
  ['monitor','Monitor & Logs'],
  ['alerts','Notifications'],
  ['users','Administrator'],
  ['settings','Admin / Management'],
  ['modules','Specification']
];
const nav = JSON.parse(fs.readFileSync(path.join(root,'data/navigation.json'),'utf8'));
assert.deepStrictEqual(nav.map(x => [x.id,x.title]), expected);
for (const file of fs.readdirSync(path.join(root,'html')).filter(x=>x.endsWith('.html'))) {
  const html=fs.readFileSync(path.join(root,'html',file),'utf8');
  if (!html.includes('class="nt-side"')) continue;
  const block=html.match(/<nav class="nt-side">([\s\S]*?)<\/nav>/)[1];
  const actual=[...block.matchAll(/data-nav="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(m=>[m[1],m[2]]);
  assert.deepStrictEqual(actual, expected, `sidebar mismatch: ${file}`);
}
console.log('navigation.test.js passed');
