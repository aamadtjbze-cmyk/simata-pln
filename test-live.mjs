async function verifyAll() {
  const domains = [
    'https://simatav2.netlify.app',
    'https://simata-pln-uik.netlify.app'
  ];

  for (const domain of domains) {
    console.log(`\n========================================`);
    console.log(`Testing Domain: ${domain}`);
    const r = await fetch(domain);
    console.log(`HTML Status: ${r.status}`);
    const html = await r.text();
    
    const assetMatches = Array.from(html.matchAll(/(src|href)="([^"]+)"/g)).map(m => m[2]);
    for (const asset of assetMatches) {
      const fullUrl = new URL(asset, domain).href;
      const res = await fetch(fullUrl);
      console.log(`  Asset: ${asset} -> Status: ${res.status} (${res.headers.get('content-type')})`);
    }
  }
}

verifyAll().catch(console.error);
