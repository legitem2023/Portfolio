export const emailTemplates = {
  welcome: (data:any) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { 
            background: linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 50%, #ffffff 100%);
            padding: 30px 20px; 
            text-align: center; 
            position: relative;
            border-bottom: 1px solid #EDE9FE;
          }
          .logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
          }
          .logo {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(139, 92, 246, 0.2);
          }
          .logo img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
          }
          .header h1 { 
            color: #4C1D95; 
            margin: 0; 
            font-size: 28px;
            text-shadow: 0 2px 4px rgba(255,255,255,0.5);
          }
          .content { padding: 40px 30px; background: white; }
          .button { 
            background: linear-gradient(135deg, #8B5CF6, #A78BFA); 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
          }
          .footer { 
            background: #F5F3FF; 
            padding: 20px; 
            text-align: center; 
            color: #6B7280;
            border-top: 1px solid #EDE9FE;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <div class="logo">
                <img src="/VendorCity_Rider.webp" alt="VendorCity Rider" />
              </div>
            </div>
            <h1>Welcome, ${data.name}!</h1>
          </div>
          <div class="content">
            <p>Thank you for joining us. Your account has been created successfully.</p>
            <p>Email: <strong>${data.email}</strong></p>
            ${data.verificationLink ? `
              <p>Please verify your email by clicking below:</p>
              <p><a href="${data.verificationLink}" class="button">Verify Email</a></p>
            ` : ''}
            <p>Best regards,<br>Your Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 VendorCity. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  resetPassword: (data:any) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { 
            background: linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 50%, #ffffff 100%);
            padding: 30px 20px; 
            text-align: center;
            border-bottom: 1px solid #EDE9FE;
          }
          .logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
          }
          .logo {
            width: 70px;
            height: 70px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(139, 92, 246, 0.2);
          }
          .logo img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
          }
          .header h2 { color: #4C1D95; margin: 0; }
          .content { padding: 40px 30px; background: white; }
          .button { 
            background: linear-gradient(135deg, #DC2626, #EF4444); 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
          }
          .footer { 
            background: #F5F3FF; 
            padding: 20px; 
            text-align: center; 
            color: #6B7280;
            border-top: 1px solid #EDE9FE;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <div class="logo">
                <img src="/VendorCity_Rider.webp" alt="VendorCity Rider" />
              </div>
            </div>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Click the link below to reset your password:</p>
            <p><a href="${data.resetLink}" class="button">Reset Password</a></p>
            <p>This link expires in 1 hour.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 VendorCity. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  notification: (data:any) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { 
            background: linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 50%, #ffffff 100%);
            padding: 25px 20px; 
            text-align: center;
            border-bottom: 1px solid #EDE9FE;
          }
          .logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 10px;
          }
          .logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(139, 92, 246, 0.2);
          }
          .logo img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
          }
          .header h3 { color: #4C1D95; margin: 0; }
          .content { padding: 30px; background: white; }
          .footer { 
            background: #F5F3FF; 
            padding: 20px; 
            text-align: center; 
            color: #6B7280;
            border-top: 1px solid #EDE9FE;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <div class="logo">
                <img src="/VendorCity_Rider.webp" alt="VendorCity Rider" />
              </div>
            </div>
            <h3>${data.title}</h3>
          </div>
          <div class="content">
            <p>${data.message}</p>
            ${data.actionUrl ? `<p><a href="${data.actionUrl}" style="color: #8B5CF6; text-decoration: underline;">View Details →</a></p>` : ''}
          </div>
          <div class="footer">
            <p>&copy; 2024 VendorCity. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
};
