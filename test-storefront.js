async function testStorefront() {
  try {
    console.log('Testing storefront API...');
    const response = await fetch('http://localhost:10000/api/store/agent/kwame');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStorefront();