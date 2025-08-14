import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(email, token, name) {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email - Welcome!",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome ${name}!</h2>
          <p>Thank you for registering with us. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendPasswordResetEmail(email, token) {
  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${token}&email=${email}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Password",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello!</h2>
          <p>You are receiving this email because we received a password reset request for your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" 
               style="background-color: #222; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetURL}</p>
          <p><strong>This link will expire in 60 minutes.</strong></p>
          <p>If you did not request a password reset, no further action is required.</p>
        </div>
      `,
  };

  await transporter.sendMail(mailOptions);
}

function generateAmazonStyleTracker(currentStatusId) {
  const checkmarkIcon =
    "https://m.media-amazon.com/images/G/01/outbound/etc/steptracker-checkmark._CB552848383_.png";
  const pendingIcon =
    "https://m.media-amazon.com/images/G/01/outbound/etc/pixel.gif";

  const orderStatuses = [
    { id: 1, name: "Ordered" },
    { id: 2, name: "Shipped" },
    { id: 3, name: "Out for Delivery" },
    { id: 4, name: "Delivered" },
  ];

  return `
  <table cellpadding="0" cellspacing="0" role="list" width="100%" border="0" style="font-family:Arial,sans-serif;font-size:15px;line-height:22px;width:100%;border:none"><tbody><tr>
    ${orderStatuses
      .map((status, index) => {
        const isCompleted = status.id <= currentStatusId;
        const isLast = index === orderStatuses.length - 1;
        const isFirst = index === 0;

        return `
        <td width="${100 / orderStatuses.length}%" valign="top" role="listitem">
          <table cellpadding="0" cellspacing="0" width="100%" border="0" style="width:100%;border:none">
            <tbody>
              <tr>
                <td style="height:18px">
                  <table cellpadding="0" cellspacing="0" width="100%" border="0" style="width:100%;border:none">
                    <tbody>
                      <tr>
                       
                        <td width="50%" height="18">
                          <table cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr><td height="7"></td></tr>
                              <tr>
                                <td height="4">
                                  ${
                                    !isFirst
                                      ? `<div style="width:100%;border-bottom:4px solid ${
                                          status.id <= currentStatusId
                                            ? "#44ae7c"
                                            : "#e9e7e7"
                                        };"></div>`
                                      : ""
                                  }
                                </td>
                              </tr>
                              <tr><td height="7"></td></tr>
                            </tbody>
                          </table>
                        </td>

                        
                        <td height="18">
                          <table cellpadding="0" cellspacing="0" width="18" border="0">
                            <tbody>
                              <tr>
                                <td width="18" height="18" align="center">
                                  <div style="border-radius:18px;background:${
                                    isCompleted ? "#44ae7c" : "#e9e7e7"
                                  };line-height:17px">
                                    <img src="${
                                      isCompleted ? checkmarkIcon : pendingIcon
                                    }"
                                      width="19" height="19"
                                      style="width:18px;height:18px;display:block"
                                      alt="${
                                        isCompleted ? "Completed" : "Pending"
                                      }">
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>

                       
                        <td width="50%" height="18">
                          <table cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr><td height="7"></td></tr>
                              <tr>
                                <td height="4">
                                  ${
                                    !isLast
                                      ? `<div style="width:100%;border-bottom:4px solid ${
                                          status.id < currentStatusId
                                            ? "#44ae7c"
                                            : "#e9e7e7"
                                        };"></div>`
                                      : ""
                                  }
                                </td>
                              </tr>
                              <tr><td height="7"></td></tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <tr><td height="5"></td></tr>

              <tr>
                <td>
                  <div style="font-size:15px;font-weight:${
                    isCompleted ? "700" : "400"
                  };line-height:21px;text-align:center;color:#0f1111">
                    <span>${status.name}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>`;
      })
      .join("")}
  </tr></tbody></table>`;
}

async function sendOrderConfirmationEmail(email, orderData) {
  const {
    username,
    orderId,
    orderItems,
    address,
    amount,
    deliveryFee,
    paymentType,
  } = orderData;

  const startDate = new Date(Date.now() + 30 * 60 * 1000);
  const endDate = new Date(Date.now() + 60 * 60 * 1000);

  const logoUrl =
    "https://res.cloudinary.com/dgl6dgyzy/image/upload/v1754316669/broccoli_thmgde.png";

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const orderItemsHTML = orderItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px; vertical-align: middle;">
        <table style="border-collapse: collapse;">
          <tr>
      <td style="padding-right: 10px;">
        <img src="${item.image}" alt="${
        item.name
      }" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px;" />
      </td>
      <td style="vertical-align: middle; font-size: 15px; color: #333;">
        ${item.name}
      </td>
    </tr>
  </table>
</td>

      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">$${
        item.price.toFixed(2) * item.quantity
      }</td>
    </tr>
  `
    )
    .join("");

  const currentStatusId = 1;
  const statusBarHTML = generateAmazonStyleTracker(currentStatusId);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order Confirmation - Order #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <div style="margin-bottom: 30px; text-align: center;">
            <table align="center" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td>
                  <img src="${logoUrl}" alt="Greenmart Logo" style="height: 30px; vertical-align: middle; display: inline-block;" />
                </td>
                <td style="padding-left: 10px;">
                  <span style="font-size: 28px; font-weight: bold; vertical-align: middle; display: inline-block;">
                    Greenmart
                  </span>
                </td>
              </tr>
            </table>
          </div>

${statusBarHTML}
         
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${username}!</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Thank you for shopping with GreenMart!<br>
            We’ve received your order <strong>#${orderId}</strong> and it’s on its way!
          </p>

         
          <div style="background-color: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin-bottom: 25px;">
            <p style="margin: 0; color: #2d5a2d; font-weight: bold;">Fast Grocery Delivery:</p>
            <ul style="color: #2d5a2d; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Items will arrive within 30 minutes to 1 hour.</li>
              <li>Keep your phone nearby for delivery updates.</li>
              ${paymentType === "cash" ? "<li>Get your cash ready.</li>" : ""}
              
            </ul>
          </div>

         
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📦 Delivery Information</h3>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Estimated Arrival:</strong><br>
              <span style="color: #28a745; font-weight: bold;">
                Today between ${formatTime(startDate)} and ${formatTime(
      endDate
    )}
              </span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Delivery Method:</strong><br>
              <span>Home or Office Delivery</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #555;">Recipient:</strong><br>
              <span>${address.first_name} ${address.last_name} (${
      address.phone
    })</span>
            </div>
            
            <div>
              <strong style="color: #555;">Address:</strong><br>
              <span>${address.street}, ${address.city}, ${address.state}, ${
      address.country
    }</span>
            </div>
          </div>

        
          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🛒 Order Summary</h3>
            
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
              <thead>
                <tr style="background-color: #44ae7c; color: white;">
                  <th style="padding: 12px; text-align: left;">Product</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHTML}
              </tbody>
            </table>
          </div>

     
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #555;">Subtotal:</td>
                <td style="padding: 5px 0; text-align: right; color: #555;">$${(
                  amount - deliveryFee
                ).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #555;">Delivery Fee:</td>
                <td style="padding: 5px 0; text-align: right; color: #555;">$${deliveryFee.toFixed(
                  2
                )}</td>
              </tr>
              <tr style="border-top: 2px solid #28a745; font-weight: bold; font-size: 18px;">
                <td style="padding: 15px 0 5px 0; color: #333;">Total:</td>
                <td style="padding: 15px 0 5px 0; text-align: right; color: #28a745;">$${amount.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #555;">Payment Method:</td>
                <td style="padding: 5px 0; text-align: right; color: #555; text-transform: capitalize;">
                  ${paymentType === "cash" ? "Cash on Delivery" : "PayPal"}
                </td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">Need Help?</h3>
            <ul style="color: #1565c0; margin: 0; padding-left: 20px;">
              <li>Visit our <a href="${
                process.env.CLIENT_URL
              }/help" style="color: #1976d2;">Help Center</a></li>
              <li>Contact our customer support team</li>
              <li>Track your order in your account</li>
            </ul>
          </div>

         
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #44ae7c; font-weight: bold; margin: 0 0 10px 0;">Thanks for choosing GreenMart!</p>
            <p style="color: #666; margin: 0; font-size: 14px;">
              With love from the GreenMart team 💚
            </p>
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This email was sent to ${email}. Questions? Contact our support.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendOrderStatusEmail(email, orderData) {
  const {
    orderId,
    statusId,
    subject,
    headerMessage,
    orderItems,
    address,
    deliveryFee,
    amount,
    paymentType,
  } = orderData;

  const currentStatusId = statusId;
  const statusBarHTML = generateAmazonStyleTracker(currentStatusId);

  const orderItemsHTML = orderItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px; vertical-align: middle;">
        <table style="border-collapse: collapse;">
          <tr>
            <td style="padding-right: 10px;">
              <img src="${item.image}" alt="${
        item.name
      }" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px;" />
            </td>
            <td style="vertical-align: middle; font-size: 15px; color: #333;">
              ${item.name}
            </td>
          </tr>
        </table>
      </td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">$${item.price.toFixed(
        2
      )}</td>
    </tr>`
    )
    .join("");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; color: #333;">
      <div style="
  text-align: center;
  background-color: #e8f5e9;
  border-left: 6px solid #44ae7c;
  padding: 20px;
  border-radius: 6px;
  font-size: 20px;
  font-weight: bold;
  color: #2d5a2d;
  margin-bottom: 25px;
">
  ${headerMessage}
</div>


      ${statusBarHTML}

      <div style="margin-top: 30px; margin-bottom: 25px; background-color: #f8f9fa; padding: 20px; border-radius: 6px;">
  <h3 style="color: #333; margin-bottom: 20px; font-size: 18px;">📦 Delivery Information</h3>

  <table style="width: 100%; font-size: 14px; color: #000; border-spacing: 0 10px;">
    <tr>
      <td style="color: #555; font-weight: bold; width: 120px;">Order ID:</td>
      <td>${orderId}</td>
    </tr>
    <tr>
      <td style="color: #555; font-weight: bold;">Recipient:</td>
      <td>${address.firstName} ${address.lastName}</td>
    </tr>
    <tr>
      <td style="color: #555; font-weight: bold;">Phone:</td>
      <td>${address.phone}</td>
    </tr>
    <tr>
      <td style="color: #555; font-weight: bold;">Address:</td>
      <td>${address.street}, ${address.city}, ${address.state}, ${
      address.country
    }</td>
    </tr>
  </table>
</div>


      <div style="margin-bottom: 25px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">🛒 Order Summary</h3>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background-color: #44ae7c; color: white;">
              <th style="padding: 12px; text-align: left;">Product</th>
              <th style="padding: 12px; text-align: center;">Qty</th>
              <th style="padding: 12px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHTML}
          </tbody>
        </table>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #555;">Subtotal:</td>
            <td style="padding: 5px 0; text-align: right; color: #555;">$${(
              amount - deliveryFee
            ).toFixed(2)}</td>
          </tr>
          <tr>
                <td style="padding: 5px 0; color: #555;">Delivery Fee:</td>
                <td style="padding: 5px 0; text-align: right; color: #555;">$${deliveryFee.toFixed(
                  2
                )}</td>
              </tr>
          <tr style="border-top: 2px solid #44ae7c; font-weight: bold; font-size: 18px;">
            <td style="padding: 15px 0 5px 0; color: #333;">Total:</td>
            <td style="padding: 15px 0 5px 0; text-align: right; color: #44ae7c;">$${amount.toFixed(
              2
            )}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #555;">Payment Method:</td>
            <td style="padding: 5px 0; text-align: right; color: #555; text-transform: capitalize;">
              ${paymentType === "cash" ? "Cash on Delivery" : "PayPal"}
            </td>
          </tr>
        </table>
      </div>
    </div>
  `,
  };

  await transporter.sendMail(mailOptions);
}

export {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
};
