const fs = require('fs');
const html = fs.readFileSync('scripts/knit_sample.html', 'utf8');

// Title / H1
const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
console.log('H1:', h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : 'None');

// Tables
const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
console.log('Tables found:', tables.length);
tables.forEach((t, i) => {
  const rows = (t.match(/<tr[\s\S]*?<\/tr>/gi) || []).length;
  console.log(`Table ${i} rows:`, rows);
  console.log('Snippet:', t.slice(0, 300).replace(/\s+/g, ' '));
});

// Images
const imgs = html.match(/<img[^>]+>/gi) || [];
console.log('Images found:', imgs.length);
imgs.forEach(img => {
  const match = img.match(/src=["']([^"']+)["']/i);
  if (match) {
    console.log(' Image src:', match[1]);
  }
});

// Sections / Headings
const h2s = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
console.log('\nH2 headings:');
h2s.forEach(h => console.log(' - ', h.replace(/<[^>]+>/g, '').trim()));
