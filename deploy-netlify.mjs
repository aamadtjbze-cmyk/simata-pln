import fs from 'fs';

const TOKEN = 'nfp_MvpTuPSTPTBQoiBMPkmV2VyJPGCBMuqb1802';
const AUTH_HEADER = { 'Authorization': `Bearer ${TOKEN}` };

async function deploy() {
  console.log('1. Memeriksa daftar situs Netlify...');
  const sitesRes = await fetch('https://api.netlify.com/api/v1/sites', { headers: AUTH_HEADER });
  const sites = await sitesRes.json();
  
  let targetSite = sites.find(s => s.name?.includes('simata'));
  
  if (!targetSite) {
    console.log('2. Membuat situs baru di Netlify...');
    const createRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'simata-pln-uik' })
    });
    targetSite = await createRes.json();
    if (!targetSite.id) {
      // Fallback with random suffix
      const fallbackName = `simata-pln-${Math.random().toString(36).substring(2, 7)}`;
      const fallbackRes = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fallbackName })
      });
      targetSite = await fallbackRes.json();
    }
  }

  console.log(`Target Site: ${targetSite.name} (ID: ${targetSite.id || targetSite.site_id})`);
  const siteId = targetSite.id || targetSite.site_id;

  console.log('3. Mengunggah dist.zip ke Netlify Production...');
  const zipBuffer = fs.readFileSync('dist.zip');

  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      ...AUTH_HEADER,
      'Content-Type': 'application/zip'
    },
    body: zipBuffer
  });

  const deployData = await deployRes.json();
  console.log('=== DEPLOYMENT BERHASIL ===');
  console.log('Site URL:', targetSite.ssl_url || targetSite.url || `https://${targetSite.name}.netlify.app`);
  console.log('Deploy URL:', deployData.ssl_url || deployData.deploy_ssl_url || deployData.url);
  console.log('Deploy State:', deployData.state);
}

deploy().catch(err => {
  console.error('Deployment Error:', err);
});
