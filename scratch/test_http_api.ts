import axios from 'axios';

async function testHttpApi() {
  const apiKey = 'xsmtpsib-e3844e785d288b06b1b4487182056e9cd5ce448f2f09fe36eb45186b9e152fd5-z1iV3HS8OwJW6l0y';
  const url = 'https://api.brevo.com/v3/smtp/email';

  console.log('Testing Brevo HTTP API sending...');

  try {
    const response = await axios.post(url, {
      sender: {
        name: 'Hristo Silk',
        email: 'guardsowh@gmail.com'
      },
      to: [
        {
          email: 'guardsowh@gmail.com',
          name: 'Hristo Test'
        }
      ],
      subject: 'Test Brevo HTTP API',
      htmlContent: '<html><body><h1>Test Successful!</h1><p>Sent via Brevo HTTP API.</p></body></html>'
    }, {
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      }
    });

    console.log('✅ Brevo HTTP API success! Status:', response.status);
    console.log('Response data:', response.data);
  } catch (error: any) {
    if (error.response) {
      console.error('❌ Brevo HTTP API failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Request failed:', error.message);
    }
  }
}

testHttpApi();
