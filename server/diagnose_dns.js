const dns = require('dns').promises;
const fs = require('fs');

const envPath = __dirname + '/.env';
let defaultHost = 'fullstack-friends.ptbsqrm.mongodb.net';
try {
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    const m = env.match(/^MONGO_URI=(.*)$/m);
    if (m && m[1]) {
      const uri = m[1].trim();
      const hostMatch = uri.match(/@([\w.-]+)\//);
      if (hostMatch) defaultHost = hostMatch[1];
    }
  }
} catch (e) {}

const host = process.argv[2] || defaultHost;

async function run() {
  console.log('Testing DNS for:', host);

  try {
    console.log('\n1) Resolve SRV (_mongodb._tcp):');
    const srv = await dns.resolveSrv('_mongodb._tcp.' + host);
    console.log(srv);
  } catch (err) {
    console.error('SRV lookup failed:', err && err.code ? err.code : err.message || err);
  }

  try {
    console.log('\n2) Resolve A/AAAA records:');
    const a = await dns.resolve4(host);
    console.log('A records:', a);
  } catch (err) {
    console.error('A lookup failed:', err && err.code ? err.code : err.message || err);
  }

  try {
    console.log('\n3) Generic lookup (may follow CNAMEs):');
    const lk = await dns.lookup(host, { all: true });
    console.log(lk);
  } catch (err) {
    console.error('Lookup failed:', err && err.code ? err.code : err.message || err);
  }

  console.log('\nDone. If lookups fail, try:');
  console.log('- nslookup -type=SRV _mongodb._tcp.' + host + ' 8.8.8.8');
  console.log('- nslookup ' + host + ' 8.8.8.8');
  console.log("Or switch your DNS to 8.8.8.8/1.1.1.1 and retry, or test from another network (mobile hotspot).\n");
}

run();
