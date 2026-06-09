import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || 'ab25bd001@smtp-brevo.com';
  const pass = process.env.SMTP_PASS;

  if (!pass) {
    console.warn('⚠️ SMTP_PASS is not configured. Email service will run in mock/log mode.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports (like 587)
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendOrderConfirmationEmail = async (order: any, items: any[]) => {
  const recipientEmail = order.email || order.shipping_address?.email || order.shipping?.email;
  if (!recipientEmail) {
    console.error('❌ Cannot send order confirmation email: Recipient email is missing.', order);
    return;
  }

  const orderNumber = order.orderNumber || order.order_number || 'N/A';
  const total = parseFloat(order.total) || 0;
  const subtotal = parseFloat(order.subtotal) || 0;
  const shippingCost = parseFloat(order.shipping_cost || order.shippingCost) || 0;
  const discountAmount = parseFloat(order.discount_amount || order.discountAmount) || 0;

  const firstName = order.first_name || order.shipping?.firstName || '';
  const lastName = order.last_name || order.shipping?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Kupac';

  // Format Items list for HTML email
  const itemsHtml = items.map((item: any) => {
    const itemName = item.name || 'Proizvod';
    const itemQty = item.quantity || 1;
    const itemPrice = parseFloat(item.price) || 0;
    const itemTotal = itemPrice * itemQty;
    const itemImage = item.image || item.image_url || '';
    
    let variantDetails = '';
    if (item.variant_info) {
      try {
        const parsed = typeof item.variant_info === 'string' ? JSON.parse(item.variant_info) : item.variant_info;
        if (parsed && typeof parsed === 'object') {
          variantDetails = `<br/><span style="font-size: 12px; color: #666;">${Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; vertical-align: middle;">
          ${itemImage ? `<img src="${itemImage}" alt="${itemName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;"/>` : ''}
          <span style="font-weight: 600; color: #333333; vertical-align: middle;">${itemName}</span>${variantDetails}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: center; color: #666666;">
          ${itemQty}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: 600; color: #333333;">
          ${itemTotal.toFixed(2)} EUR
        </td>
      </tr>
    `;
  }).join('');

  // Shipping details HTML
  let shippingAddressHtml = '';
  const shipping = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : (order.shipping_address || order.shipping || {});
  
  if (shipping && (shipping.address || shipping.city)) {
    shippingAddressHtml = `
      <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #eeeeee;">
        <h3 style="margin-top: 0; color: #1a1a1a; font-size: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Adresa dostave:</h3>
        <p style="margin: 4px 0; color: #444444; font-size: 14px;"><strong>Ime i prezime:</strong> ${shipping.firstName || firstName} ${shipping.lastName || lastName}</p>
        <p style="margin: 4px 0; color: #444444; font-size: 14px;"><strong>Adresa:</strong> ${shipping.address || shipping.addressLine1 || ''}</p>
        <p style="margin: 4px 0; color: #444444; font-size: 14px;"><strong>Grad:</strong> ${shipping.postalCode || ''} ${shipping.city || ''}</p>
        <p style="margin: 4px 0; color: #444444; font-size: 14px;"><strong>Telefon:</strong> ${shipping.phone || ''}</p>
      </div>
    `;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Potvrda narudžbe</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #111111 0%, #333333 100%); padding: 35px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">HRISTO SILK</h1>
                  <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 0.5px;">POTVRDA NARUDŽBE</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin-top: 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Hvala vam na narudžbi, ${fullName}!</h2>
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                    Vaša narudžba <strong>#${orderNumber}</strong> je uspješno zaprimljena i trenutno se obrađuje. U nastavku možete pronaći detalje vaše kupnje.
                  </p>
                  
                  <!-- Items Table -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 25px;">
                    <thead>
                      <tr style="background-color: #f8f8f8;">
                        <th style="padding: 12px; text-align: left; font-size: 13px; text-transform: uppercase; color: #666666; font-weight: 600; border-bottom: 2px solid #eeeeee;">Proizvod</th>
                        <th style="padding: 12px; text-align: center; font-size: 13px; text-transform: uppercase; color: #666666; font-weight: 600; border-bottom: 2px solid #eeeeee;">Kol.</th>
                        <th style="padding: 12px; text-align: right; font-size: 13px; text-transform: uppercase; color: #666666; font-weight: 600; border-bottom: 2px solid #eeeeee;">Cijena</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                  
                  <!-- Totals -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                      <td style="padding: 6px 12px; text-align: right; color: #666666; font-size: 14px;">Međuzbroj:</td>
                      <td style="padding: 6px 12px; text-align: right; font-weight: 500; color: #333333; font-size: 14px; width: 120px;">${subtotal.toFixed(2)} EUR</td>
                    </tr>
                    ${discountAmount > 0 ? `
                    <tr>
                      <td style="padding: 6px 12px; text-align: right; color: #e53e3e; font-size: 14px;">Popust:</td>
                      <td style="padding: 6px 12px; text-align: right; font-weight: 500; color: #e53e3e; font-size: 14px;">-${discountAmount.toFixed(2)} EUR</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 6px 12px; text-align: right; color: #666666; font-size: 14px;">Dostava:</td>
                      <td style="padding: 6px 12px; text-align: right; font-weight: 500; color: #333333; font-size: 14px;">${shippingCost === 0 ? 'BESPLATNO' : `${shippingCost.toFixed(2)} EUR`}</td>
                    </tr>
                    <tr style="border-top: 2px solid #eeeeee;">
                      <td style="padding: 15px 12px; text-align: right; font-weight: 700; color: #1a1a1a; font-size: 18px;">Ukupno:</td>
                      <td style="padding: 15px 12px; text-align: right; font-weight: 700; color: #1a1a1a; font-size: 18px;">${total.toFixed(2)} EUR</td>
                    </tr>
                  </table>

                  <!-- Shipping Address Block -->
                  ${shippingAddressHtml}

                  <!-- Order History Button -->
                  <div align="center" style="margin: 35px 0 10px 0;">
                    <a href="https://hristo-silk.vercel.app/account?tab=orders" target="_blank" style="background-color: #111111; color: #ffffff; display: inline-block; padding: 14px 28px; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background-color 0.2s;">
                      Pregledaj povijest narudžbi
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; background-color: #fcfcfc; border-top: 1px solid #eeeeee; text-align: center;">
                  <p style="margin: 0; color: #888888; font-size: 13px;">
                    Ova poruka je poslana automatski. Molimo ne odgovarajte izravno na nju.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #888888; font-size: 13px;">
                    &copy; ${new Date().getFullYear()} Hristo Silk. Sva prava pridržana.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || 'guardsowh@gmail.com';

  if (!transporter) {
    console.log(`[Email Mock/Log] To: ${recipientEmail} | Subject: Potvrda narudžbe #${orderNumber}`);
    console.log(`[Email Mock/Log] HTML Body summary: Total ${total.toFixed(2)} EUR, ${items.length} items`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Hristo Silk" <${fromEmail}>`,
      to: recipientEmail,
      subject: `Potvrda narudžbe #${orderNumber} - Hristo Silk`,
      html: emailHtml,
    });

    console.log(`📧 Email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send order confirmation email via SMTP:', error);
  }
};

export const sendOrderStatusUpdateEmail = async (order: any, newStatus: string, trackingNumber?: string) => {
  const recipientEmail = order.email || order.shipping_address?.email || order.shipping?.email;
  if (!recipientEmail) {
    console.error('❌ Cannot send status update email: Recipient email is missing.', order);
    return;
  }

  const orderNumber = order.orderNumber || order.order_number || 'N/A';
  const firstName = order.first_name || order.shipping?.firstName || '';
  const lastName = order.last_name || order.shipping?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Kupac';

  const STATUS_TRANSLATIONS: Record<string, string> = {
    'pending': 'U iščekivanju',
    'awaiting_payment': 'Čeka plaćanje',
    'paid': 'Plaćeno',
    'processing': 'U obradi',
    'shipped': 'Poslano / Otpremljeno',
    'delivered': 'Dostavljeno',
    'cancelled': 'Otkazano',
    'refunded': 'Vraćeno / Refundirano'
  };

  const statusHr = STATUS_TRANSLATIONS[newStatus] || newStatus;

  let trackingHtml = '';
  if (trackingNumber || order.tracking_number) {
    const trackNum = trackingNumber || order.tracking_number;
    trackingHtml = `
      <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd; text-align: left;">
        <h4 style="margin: 0 0 5px 0; color: #0369a1; font-size: 15px; font-weight: 700;">Podaci za praćenje:</h4>
        <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
          <strong>Broj pošiljke:</strong> <span style="font-family: monospace; font-weight: bold;">${trackNum}</span>
        </p>
      </div>
    `;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ažuriranje statusa narudžbe</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #111111 0%, #333333 100%); padding: 35px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">HRISTO SILK</h1>
                  <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 0.5px;">PROMJENA STATUSA NARUDŽBE</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <h2 style="margin-top: 0; color: #1a1a1a; font-size: 20px; font-weight: 600; text-align: left;">Pozdrav, ${fullName}!</h2>
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; text-align: left; margin-bottom: 25px;">
                    Obavještavamo vas da je status vaše narudžbe <strong>#${orderNumber}</strong> promijenjen.
                  </p>
                  
                  <!-- Status Card -->
                  <div style="background-color: #f9f9f9; border-radius: 10px; border: 1px solid #eeeeee; padding: 25px; margin: 25px 0; text-align: center;">
                    <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #888888; display: block; margin-bottom: 5px;">Novi status narudžbe:</span>
                    <strong style="font-size: 22px; color: #ab1017; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${statusHr}</strong>
                  </div>

                  <!-- Tracking info if available -->
                  ${trackingHtml}

                  <p style="color: #777777; font-size: 14px; line-height: 1.6; text-align: left; margin-top: 25px;">
                    Detaljnije informacije o vašoj narudžbi, povijesti kupnje i statusu dostave možete pratiti na vašem korisničkom profilu.
                  </p>

                  <!-- Order History Button -->
                  <div align="center" style="margin: 35px 0 10px 0;">
                    <a href="https://hristo-silk.vercel.app/account?tab=orders" target="_blank" style="background-color: #111111; color: #ffffff; display: inline-block; padding: 14px 28px; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background-color 0.2s;">
                      Pregledaj povijest narudžbi
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; background-color: #fcfcfc; border-top: 1px solid #eeeeee; text-align: center;">
                  <p style="margin: 0; color: #888888; font-size: 13px;">
                    Ova poruka je poslana automatski. Molimo ne odgovarajte izravno na nju.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #888888; font-size: 13px;">
                    &copy; ${new Date().getFullYear()} Hristo Silk. Sva prava pridržana.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || 'guardsowh@gmail.com';

  if (!transporter) {
    console.log(`[Email Mock/Log] To: ${recipientEmail} | Subject: Status narudžbe #${orderNumber} ažuriran`);
    console.log(`[Email Mock/Log] HTML Body summary: New Status: ${statusHr}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Hristo Silk" <${fromEmail}>`,
      to: recipientEmail,
      subject: `Ažuriranje statusa narudžbe #${orderNumber} - Hristo Silk`,
      html: emailHtml,
    });

    console.log(`📧 Status update email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send order status update email via SMTP:', error);
  }
};

export const sendNewsletterWelcomeEmail = async (recipientEmail: string) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Dobrodošli u Hristo Silk</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #111111 0%, #333333 100%); padding: 35px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">HRISTO SILK</h1>
                  <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 0.5px;">PRETPLATA NA NEWSLETTER</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <h2 style="margin-top: 0; color: #1a1a1a; font-size: 20px; font-weight: 600; text-align: left;">Hvala vam na pretplati!</h2>
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; text-align: left; margin-bottom: 25px;">
                    Uspješno ste se pretplatili na Hristo Silk newsletter. Drago nam je što ste dio naše zajednice!
                  </p>
                  
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; text-align: left; margin-bottom: 25px;">
                    Od sada ćete prvi primati najnovije informacije o našem asortimanu, obavijesti o novim proizvodima, taktičkim ažuriranjima i ekskluzivnim popustima samo za pretplatnike.
                  </p>

                  <!-- Shop Button -->
                  <div align="center" style="margin: 35px 0 10px 0;">
                    <a href="https://hristo-silk.vercel.app/shop" target="_blank" style="background-color: #ab1017; color: #ffffff; display: inline-block; padding: 14px 28px; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background-color 0.2s;">
                      Posjetite našu trgovinu
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; background-color: #fcfcfc; border-top: 1px solid #eeeeee; text-align: center;">
                  <p style="margin: 0; color: #888888; font-size: 13px;">
                    Primili ste ovu poruku jer ste se prijavili na newsletter na stranici Hristo Silk.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #888888; font-size: 13px;">
                    &copy; ${new Date().getFullYear()} Hristo Silk. Sva prava pridržana.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || 'guardsowh@gmail.com';

  if (!transporter) {
    console.log(`[Email Mock/Log] To: ${recipientEmail} | Subject: Dobrodošli u Hristo Silk Newsletter`);
    console.log(`[Email Mock/Log] HTML Body summary: Newsletter Welcome Email`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Hristo Silk" <${fromEmail}>`,
      to: recipientEmail,
      subject: `Dobrodošli u naš newsletter - Hristo Silk`,
      html: emailHtml,
    });

    console.log(`📧 Newsletter welcome email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send newsletter welcome email via SMTP:', error);
  }
};

export const sendContactMessageConfirmationEmail = async (name: string, recipientEmail: string, subject: string, message: string) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Potvrda upita</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #111111 0%, #333333 100%); padding: 35px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">HRISTO SILK</h1>
                  <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 0.5px;">POTVRDA ZAPRIMANJA UPITA</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin-top: 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Pozdrav, ${name}!</h2>
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                    Hvala vam što ste nas kontaktirali. Uspješno smo zaprimili vaš upit sa sljedećim detaljima:
                  </p>
                  
                  <div style="background-color: #f9f9f9; border-radius: 8px; border: 1px solid #eeeeee; padding: 15px; margin-bottom: 25px; text-align: left;">
                    <p style="margin: 4px 0; color: #444444; font-size: 14px;"><strong>Predmet:</strong> ${subject}</p>
                    <p style="margin: 10px 0 4px 0; color: #444444; font-size: 14px;"><strong>Poruka:</strong></p>
                    <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.5; font-style: italic; white-space: pre-wrap;">${message}</p>
                  </div>

                  <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                    Naš tim će pregledati vaš upit i odgovoriti vam u najkraćem mogućem roku na ovu e-mail adresu.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; background-color: #fcfcfc; border-top: 1px solid #eeeeee; text-align: center;">
                  <p style="margin: 0; color: #888888; font-size: 13px;">
                    Ova poruka je poslana automatski nakon ispunjavanja kontakt obrasca.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #888888; font-size: 13px;">
                    &copy; ${new Date().getFullYear()} Hristo Silk. Sva prava pridržana.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || 'guardsowh@gmail.com';

  if (!transporter) {
    console.log(`[Email Mock/Log] To: ${recipientEmail} | Subject: Potvrda zaprimanja upita`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Hristo Silk" <${fromEmail}>`,
      to: recipientEmail,
      subject: `Primili smo vaš upit - Hristo Silk`,
      html: emailHtml,
    });
    console.log(`📧 Contact confirmation email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('❌ Failed to send contact message confirmation email via SMTP:', error);
  }
};

export const sendServiceRequestConfirmationEmail = async (recipientEmail: string, name: string, weaponName: string, description: string, id: string) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Novi zahtjev za servisom</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #111111 0%, #333333 100%); padding: 35px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">HRISTO SILK</h1>
                  <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 0.5px;">NOVI ZAHTJEV ZA SERVISOM</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin-top: 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Pozdrav, ${name}!</h2>
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                    Uspješno ste podnijeli zahtjev za servisom/popravkom vašeg oružja pod brojem: <strong style="color: #ab1017;">#${id}</strong>
                  </p>
                  
                  <div style="background-color: #f9f9f9; border-radius: 8px; border: 1px solid #eeeeee; padding: 15px; margin-bottom: 25px; text-align: left;">
                    <p style="margin: 4px 0; color: #444444; font-size: 14px;"><strong>Oružje/Oprema:</strong> ${weaponName}</p>
                    <p style="margin: 10px 0 4px 0; color: #444444; font-size: 14px;"><strong>Opis kvara ili zahtjeva:</strong></p>
                    <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${description}</p>
                  </div>

                  <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                    Status i tijek popravka možete pratiti u bilo kojem trenutku na vašem korisničkom profilu u sekciji «Servis».
                  </p>

                  <div align="center" style="margin: 35px 0 10px 0;">
                    <a href="https://hristo-silk.vercel.app/account?tab=service" target="_blank" style="background-color: #111111; color: #ffffff; display: inline-block; padding: 14px 28px; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background-color 0.2s;">
                      Prati status servisa
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; background-color: #fcfcfc; border-top: 1px solid #eeeeee; text-align: center;">
                  <p style="margin: 0; color: #888888; font-size: 13px;">
                    Ova poruka je poslana automatski nakon otvaranja servisnog naloga.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #888888; font-size: 13px;">
                    &copy; ${new Date().getFullYear()} Hristo Silk. Sva prava pridržana.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || 'guardsowh@gmail.com';

  if (!transporter) {
    console.log(`[Email Mock/Log] To: ${recipientEmail} | Subject: Zaprimljen zahtjev za servisom`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Hristo Silk" <${fromEmail}>`,
      to: recipientEmail,
      subject: `Zaprimljen zahtjev za servisom #${id} - Hristo Silk`,
      html: emailHtml,
    });
    console.log(`📧 Service request confirmation sent to ${recipientEmail}`);
  } catch (error) {
    console.error('❌ Failed to send service request confirmation email via SMTP:', error);
  }
};

export const sendServiceRequestUpdateEmail = async (recipientEmail: string, name: string, weaponName: string, status: string, latestUpdate?: string, id?: string) => {
  const STATUS_TRANSLATIONS: Record<string, string> = {
    'Pending': 'U iščekivanju',
    'In Progress': 'U radu / Servisiranje u tijeku',
    'Completed': 'Završeno',
    'Ready for Pickup': 'Spremno za preuzimanje'
  };

  const statusHr = STATUS_TRANSLATIONS[status] || status;
  const isFinished = status === 'Completed' || status === 'Ready for Pickup';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ažuriranje zahtjeva za servisom</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #111111 0%, #333333 100%); padding: 35px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">HRISTO SILK</h1>
                  <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 0.5px;">AŽURIRANJE SERVISNOG NALOGA</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin-top: 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Pozdrav, ${name}!</h2>
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                    Obavještavamo vas da je vaš servisni nalog za **${weaponName}** ažuriran.
                  </p>
                  
                  <!-- Status Card -->
                  <div style="background-color: #f9f9f9; border-radius: 10px; border: 1px solid #eeeeee; padding: 20px; margin: 20px 0; text-align: center;">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888888; display: block; margin-bottom: 5px;">Status servisa:</span>
                    <strong style="font-size: 20px; color: #ab1017; font-weight: 800; text-transform: uppercase;">${statusHr}</strong>
                  </div>

                  <!-- Latest message if exists -->
                  ${latestUpdate ? `
                  <div style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; padding: 15px; margin-bottom: 25px; text-align: left;">
                    <p style="margin: 0 0 5px 0; color: #166534; font-size: 13px; font-weight: bold; text-transform: uppercase; tracking-widest: 0.5px;">Poruka servisera:</p>
                    <p style="margin: 0; color: #14532d; font-size: 14px; line-height: 1.5;">${latestUpdate}</p>
                  </div>
                  ` : ''}

                  <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                    ${isFinished ? 'Svoje servisirano oružje možete preuzeti na našoj lokaciji, ili pratiti daljnje upute na korisničkom profilu.' : 'Status i daljnji tijek popravka možete pratiti na vašem korisničkom profilu.'}
                  </p>

                  <div align="center" style="margin: 35px 0 10px 0;">
                    <a href="https://hristo-silk.vercel.app/account?tab=service" target="_blank" style="background-color: #111111; color: #ffffff; display: inline-block; padding: 14px 28px; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background-color 0.2s;">
                      Prati nalog na profilu
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px; background-color: #fcfcfc; border-top: 1px solid #eeeeee; text-align: center;">
                  <p style="margin: 0; color: #888888; font-size: 13px;">
                    Ova poruka je poslana automatski nakon promjene statusa servisnog naloga.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #888888; font-size: 13px;">
                    &copy; ${new Date().getFullYear()} Hristo Silk. Sva prava pridržana.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || 'guardsowh@gmail.com';

  if (!transporter) {
    console.log(`[Email Mock/Log] To: ${recipientEmail} | Subject: Ažuriranje servisnog naloga #${id}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Hristo Silk" <${fromEmail}>`,
      to: recipientEmail,
      subject: isFinished ? `Završen servis vašeg oružja - Hristo Silk` : `Ažuriranje statusa servisa #${id} - Hristo Silk`,
      html: emailHtml,
    });
    console.log(`📧 Service request update email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('❌ Failed to send service request update email via SMTP:', error);
  }
};
