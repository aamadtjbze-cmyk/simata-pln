import fs from 'fs';

const TOKEN = 'nfp_MvpTuPSTPTBQoiBMPkmV2VyJPGCBMuqb1802';
const AUTH_HEADER = { 'Authorization': `Bearer ${TOKEN}` };

async function deploy() {
  console.log('1. Mengambil semua situs Netlify...');
  const sitesRes = await fetch('https://api.netlify.com/api/v1/sites', { headers: AUTH_HEADER });
  const sites = await sitesRes.json();
  
  const zipBuffer = fs.readFileSync('dist.zip');

  for (const site of sites) {
    const siteId = site.id || site.site_id;
    console.log(`\n--> Men-deploy ke situs: ${site.name} (${site.ssl_url || site.url}) [ID: ${siteId}]...`);
    
    try {
      const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
          ...AUTH_HEADER,
          'Content-Type': 'application/zip'
        },
        body: zipBuffer
      });

      const deployData = await deployRes.json();
      console.log(`✓ Sukses: ${site.name} | State: ${deployData.state} | URL: ${site.ssl_url || site.url}`);
    } catch (err) {
      console.error(`✕ Gagal deploy ke ${site.name}:`, err);
    }
  }

  console.log('\n=== SELURUH SITUS TELAH DIPERBARUI SECARA SINKRON ===');
}

deploy().catch(err => {
  console.error('Deployment Error:', err);
});
