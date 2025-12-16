const dns = require('dns');
dns.lookup('db.jddstfppigucldetsxws.supabase.co', { all: true }, (err, addrs) => {
  if (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
  console.log('NODE RESOLVED ADDRESSES:', addrs);
});