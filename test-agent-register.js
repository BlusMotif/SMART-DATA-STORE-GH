import fetch from 'node-fetch';

async function testAgentRegistration() {
  const testData = {
    name: "Test Agent",
    email: "testagent@example.com",
    phone: "+233123456789",
    password: "testpassword123",
    storefrontSlug: "test-store",
    businessName: "Test Business",
    businessDescription: "A test business for agent registration"
  };

  try {
    const response = await fetch('http://localhost:5000/api/agent/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAgentRegistration();