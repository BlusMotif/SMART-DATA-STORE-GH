import { storage } from './dist/server/storage.js';

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
        { name: 'Daily Bundle', network: 'at_bigtime', dataAmount: '500MB', validity: '1 Day', basePrice: '2.00', agentPrice: '1.80', dealerPrice: '1.70', superDealerPrice: '1.60', masterPrice: '1.50', adminPrice: '1.40' },
        { name: 'Weekly Bundle', network: 'at_bigtime', dataAmount: '2GB', validity: '7 Days', basePrice: '8.00', agentPrice: '7.20', dealerPrice: '6.80', superDealerPrice: '6.40', masterPrice: '6.00', adminPrice: '5.60' },
        { name: 'Monthly Bundle', network: 'at_bigtime', dataAmount: '5GB', validity: '30 Days', basePrice: '20.00', agentPrice: '18.00', dealerPrice: '17.00', superDealerPrice: '16.00', masterPrice: '15.00', adminPrice: '14.00' }
      ];

      for (const bundle of sampleBundles) {
        await storage.createDataBundle(bundle);
        console.log('Created AT Bigtime bundle:', bundle.name);
      }
    }

    if (atIshareBundles.length === 0) {
      console.log('Creating sample AT iShare bundles...');
      const sampleBundles = [
        { name: 'Daily iShare', network: 'at_ishare', dataAmount: '750MB', validity: '1 Day', basePrice: '2.50', agentPrice: '2.25', dealerPrice: '2.13', superDealerPrice: '2.00', masterPrice: '1.88', adminPrice: '1.75' },
        { name: 'Weekly iShare', network: 'at_ishare', dataAmount: '3GB', validity: '7 Days', basePrice: '10.00', agentPrice: '9.00', dealerPrice: '8.50', superDealerPrice: '8.00', masterPrice: '7.50', adminPrice: '7.00' },
        { name: 'Monthly iShare', network: 'at_ishare', dataAmount: '8GB', validity: '30 Days', basePrice: '25.00', agentPrice: '22.50', dealerPrice: '21.25', superDealerPrice: '20.00', masterPrice: '18.75', adminPrice: '17.50' }
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