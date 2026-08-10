const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = [
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 
  'Source Sans Pro', 'Slabo 27px', 'Raleway', 'PT Sans', 'Merriweather',
  'Noto Sans', 'Nunito', 'Concert One', 'Playfair Display', 'Rubik',
  'Lora', 'Work Sans', 'Fira Sans', 'Quicksand', 'Inter',
  'Anton', 'Bebas Neue', 'Dancing Script', 'Pacifico', 'Cinzel'
];

const downloadFont = (fontFamily) => {
  return new Promise((resolve, reject) => {
    const formattedName = fontFamily.replace(/ /g, '+');
    // Using an old Android User-Agent forces Google Fonts to serve .ttf instead of .woff2
    const options = {
      hostname: 'fonts.googleapis.com',
      path: `/css?family=${formattedName}:700,400`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 4.1.1; en-gb; Build/KLP) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30'
      }
    };

    https.get(options, (res) => {
      let css = '';
      res.on('data', chunk => css += chunk);
      res.on('end', () => {
        // Find the first url(...) in the CSS
        const match = css.match(/url\((https:\/\/[^)]+\.ttf)\)/i);
        if (match && match[1]) {
          const ttfUrl = match[1];
          const dest = path.join(__dirname, '../public/fonts', `${fontFamily.replace(/ /g, '')}.ttf`);
          
          https.get(ttfUrl, (ttfRes) => {
            const file = fs.createWriteStream(dest);
            ttfRes.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve({ family: fontFamily, file: `${fontFamily.replace(/ /g, '')}.ttf` });
            });
          }).on('error', reject);
        } else {
          console.log('No TTF found for', fontFamily);
          resolve(null);
        }
      });
    }).on('error', reject);
  });
};

async function main() {
  if (!fs.existsSync(path.join(__dirname, '../public/fonts'))) {
    fs.mkdirSync(path.join(__dirname, '../public/fonts'), { recursive: true });
  }

  const results = [];
  for (const font of fonts) {
    console.log(`Downloading ${font}...`);
    try {
      const res = await downloadFont(font);
      if (res) results.push(res);
    } catch (e) {
      console.error(`Failed ${font}:`, e.message);
    }
  }

  console.log('\n--- FONT_MAP for ffmpegService.js ---');
  let mapString = 'export const FONT_MAP = {\n';
  results.forEach(r => {
    mapString += `  '${r.family}': '/fonts/${r.file}',\n`;
  });
  mapString += '};\n';
  console.log(mapString);

  console.log('\n--- CSS Imports for index.css ---');
  const cssUrl = `https://fonts.googleapis.com/css2?family=${results.map(r => r.family.replace(/ /g, '+')).join('&family=')}&display=swap`;
  console.log(`@import url('${cssUrl}');`);
}

main();
