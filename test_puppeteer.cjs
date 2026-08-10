const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });
  
  // Click style editor button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const styleBtn = btns.find(b => b.textContent.includes('Style'));
    if (styleBtn) styleBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Find color inputs
  const colors = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="color"]'));
    return inputs.map(i => i.value);
  });
  console.log('Initial color values:', colors);
  
  // Change the first one (Text Color) to red
  await page.evaluate(() => {
    const input = document.querySelectorAll('input[type="color"]')[0];
    input.value = '#ff0000';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Read spans
  const spans = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span.uppercase'));
    return spans.map(s => s.textContent);
  });
  console.log('Spans after change:', spans);
  
  await browser.close();
})();
