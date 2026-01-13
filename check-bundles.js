import { storage } from './dist/server/storage.js';

async function checkBundles() {
  try {
    const bundles = await storage.getDataBundles();
    console.log('Total bundles:', bundles.length);
    const networks = [...new Set(bundles.map(b => b.network))];
    console.log('Networks:', networks);
    const atBigtimeBundles = bundles.filter(b => b.network === 'at_bigtime');
    console.log('AT Bigtime bundles:', atBigtimeBundles.length);
    const atIshareBundles = bundles.filter(b => b.network === 'at_ishare');
    console.log('AT iShare bundles:', atIshareBundles.length);
    if (atBigtimeBundles.length > 0) {
      console.log('Sample AT Bigtime bundle:', JSON.stringify(atBigtimeBundles[0], null, 2));
    }
    if (atIshareBundles.length > 0) {
      console.log('Sample AT iShare bundle:', JSON.stringify(atIshareBundles[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBundles();