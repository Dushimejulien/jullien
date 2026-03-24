const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`[BROWSER ERROR] ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(5000); // give it time to fetch and render
    
    // Also check if products are in the DOM
    const html = await page.content();
    console.log(`[DOM INFO] Total characters in HTML: ${html.length}`);
    const numProducts = await page.evaluate(() => {
      return document.querySelectorAll('.product-card').length;
    });
    console.log(`[DOM INFO] Products rendered: ${numProducts}`);

  } catch (err) {
    console.error(`[PUPPETEER SCRIPT ERROR] ${err.message}`);
  } finally {
    await browser.close();
  }
})();
