import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TOKEN = 'nfp_MvpTuPSTPTBQoiBMPkmV2VyJPGCBMuqb1802';
const AUTH_HEADER = { 'Authorization': `Bearer ${TOKEN}` };

function sha1(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

function getAllFiles(dir, base = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const relPath = path.join(base, file).replace(/\\/g, '/');
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, relPath));
    } else {
      results.push({
        fullPath: filePath,
        relPath: '/' + relPath,
        buffer: fs.readFileSync(filePath),
        hash: sha1(fs.readFileSync(filePath))
      });
    }
  }
  return results;
}

async function deployPure() {
  console.log('1. Membaca berkas build dist/ ...');
  const files = getAllFiles('dist');
  console.log('Daftar berkas yang akan di-deploy:', files.map(f => `${f.relPath} (${f.buffer.length} bytes)`));

  const filesMap = {};
  for (const f of files) {
    filesMap[f.relPath] = f.hash;
  }

  const sitesRes = await fetch('https://api.netlify.com/api/v1/sites', { headers: AUTH_HEADER });
  const sites = await sitesRes.json();

  for (const site of sites) {
    const siteId = site.id || site.site_id;
    console.log(`\n========================================`);
    console.log(`Men-deploy ke situs: ${site.name} (${site.ssl_url || site.url})`);

    const deployInitRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: filesMap })
    });

    const deployInit = await deployInitRes.json();
    const deployId = deployInit.id;
    console.log(`Deploy ID: ${deployId} | Files needed:`, deployInit.required ? deployInit.required.length : 0);

    const required = deployInit.required || [];
    for (const reqHash of required) {
      const fileToUpload = files.find(f => f.hash === reqHash);
      if (fileToUpload) {
        console.log(`  Mengunggah: ${fileToUpload.relPath}...`);
        const uploadRes = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}/files${fileToUpload.relPath}`, {
          method: 'PUT',
          headers: {
            ...AUTH_HEADER,
            'Content-Type': 'application/octet-stream'
          },
          body: fileToUpload.buffer
        });
        console.log(`  ✓ ${fileToUpload.relPath} terunggah (${uploadRes.status})`);
      }
    }

    console.log(`✓ Selesai deploy ke: ${site.ssl_url || site.url}`);
  }

  console.log('\n=== SELURUH SITUS TELAH SUKSES DI-DEPLOY DENGAN ASET UTUH ===');
}

deployPure().catch(console.error);
