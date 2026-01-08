import { storage } from './server/storage.js';

async function checkAndCreateBundles() {
  try {
    const bundles = await storage.getDataBundles();
    console.log('Total bundles:', bundles.length);
    const networks = [...new Set(bundles.map(b => b.network))];
    console.log('Networks:', networks);

    const atBigtimeBundles = bundles.filter(b => b.network === 'at_bigtime');
    const atIshareBundles = bundles.filter(b => b.network === 'at_ishare');

    console.log('AT Bigtime bundles:', atBigtimeBundles.length);
    console.log('AT iShare bundles:', atIshareBundles.length);

    // If no bundles exist for the new networks, create some sample ones
    if (atBigtimeBundles.length === 0) {
      console.log('Creating sample AT Bigtime bundles...');
      const sampleBundles = [
        { name: 'Daily Bundle', network: 'at_bigtime', dataAmount: '500MB', validity: '1 Day', basePrice: '2.00', costPrice: '1.50' },
        { name: 'Weekly Bundle', network: 'at_bigtime', dataAmount: '2GB', validity: '7 Days', basePrice: '8.00', costPrice: '6.50' },
        { name: 'Monthly Bundle', network: 'at_bigtime', dataAmount: '5GB', validity: '30 Days', basePrice: '20.00', costPrice: '16.00' }
      ];

      for (const bundle of sampleBundles) {
        await storage.createDataBundle(bundle);
        console.log('Created AT Bigtime bundle:', bundle.name);
      }
    }

    if (atIshareBundles.length === 0) {
      console.log('Creating sample AT iShare bundles...');
      const sampleBundles = [
        { name: 'Daily iShare', network: 'at_ishare', dataAmount: '750MB', validity: '1 Day', basePrice: '2.50', costPrice: '1.90' },
        { name: 'Weekly iShare', network: 'at_ishare', dataAmount: '3GB', validity: '7 Days', basePrice: '10.00', costPrice: '8.00' },
        { name: 'Monthly iShare', network: 'at_ishare', dataAmount: '8GB', validity: '30 Days', basePrice: '25.00', costPrice: '20.00' }
      ];

      for (const bundle of sampleBundles) {
        await storage.createDataBundle(bundle);
        console.log('Created AT iShare bundle:', bundle.name);
      }
    }

    console.log('Bundle creation complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndCreateBundles();