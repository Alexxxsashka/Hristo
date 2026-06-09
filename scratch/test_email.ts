import nodemailer from 'nodemailer';

async function testEmail() {
  const host = 'smtp-relay.brevo.com';
  const port = 587;
  const user = 'ab25bd001@smtp-brevo.com';
  // Let's test with 'guardsowh@gmail.com' as a potential password first to see if that's what was meant,
  // or see if it fails with auth error.
  const pass = 'xsmtpsib-e3844e785d288b06b1b4487182056e9cd5ce448f2f09fe36eb45186b9e152fd5-z1iV3HS8OwJW6l0y'; 

  console.log(`Testing SMTP connection to ${host}:${port} with user ${user}...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection and authentication successful!');
    
    const info = await transporter.sendMail({
      from: `"Hristo Test" <guardsowh@gmail.com>`,
      to: 'guardsowh@gmail.com',
      subject: 'Test SMTP Brevo',
      text: 'This is a test email from Hristo app.',
    });
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Test failed with error:', error);
  }
}

testEmail();
