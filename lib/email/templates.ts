export const emailTemplates = {
  welcome: (data:any) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .header { 
            background-color: #8B5CF6;
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            color: white; 
            margin: 15px 0 0 0; 
            font-size: 28px;
          }
          .content { 
            padding: 40px 30px; 
            background: white;
            color: #333333;
          }
          .button { 
            background-color: #8B5CF6;
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer { 
            background-color: #F3F0FF;
            padding: 20px; 
            text-align: center; 
            color: #666666;
            font-size: 12px;
            border-top: 1px solid #E9E0FF;
          }
          .logo {
            display: block;
            margin: 0 auto;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: white;
            padding: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
                            <img 
                src="https://via.placeholder.com/80x80/8B5CF6/ffffff?text=R" 
                alt="VendorCity Rider" 
                width="80" 
                height="80"
                style="display: block; margin: 0 auto; border-radius: 50%; border: 3px solid white;"
              />
            <h1>Welcome, ${data.name}!</h1>
          </div>
          <div class="content">
            <p>Thank you for joining us. Your account has been created successfully.</p>
            <p style="margin: 20px 0;"><strong>Email:</strong> ${data.email}</p>
            ${data.verificationLink ? `
              <p>Please verify your email by clicking below:</p>
              <p style="text-align: center;">
                <a href="${data.verificationLink}" class="button" style="color: white; background-color: #8B5CF6;">Verify Email</a>
              </p>
            ` : ''}
            <p>Best regards,<br>Your Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VendorCity. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  resetPassword: (data:any) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .header { 
            background-color: #8B5CF6;
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h2 { 
            color: white; 
            margin: 15px 0 0 0; 
          }
          .content { 
            padding: 40px 30px; 
            background: white;
            color: #333333;
          }
          .button { 
            background-color: #DC2626;
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer { 
            background-color: #F3F0FF;
            padding: 20px; 
            text-align: center; 
            color: #666666;
            font-size: 12px;
            border-top: 1px solid #E9E0FF;
          }
          .logo {
            display: block;
            margin: 0 auto;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: white;
            padding: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
                            <img 
                src="https://via.placeholder.com/80x80/8B5CF6/ffffff?text=R" 
                alt="VendorCity Rider" 
                width="80" 
                height="80"
                style="display: block; margin: 0 auto; border-radius: 50%; border: 3px solid white;"
              />
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Click the link below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${data.resetLink}" class="button" style="color: white; background-color: #DC2626;">Reset Password</a>
            </p>
            <p style="color: #666666; font-size: 14px;">This link expires in 1 hour.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VendorCity. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  notification: (data:any) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .header { 
            background-color: #8B5CF6;
            padding: 25px 20px; 
            text-align: center; 
          }
          .header h3 { 
            color: white; 
            margin: 15px 0 0 0; 
          }
          .content { 
            padding: 30px; 
            background: white;
            color: #333333;
          }
          .footer { 
            background-color: #F3F0FF;
            padding: 20px; 
            text-align: center; 
            color: #666666;
            font-size: 12px;
            border-top: 1px solid #E9E0FF;
          }
          .logo {
            display: block;
            margin: 0 auto;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background-color: white;
            padding: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
                            <img 
                src="https://via.placeholder.com/70x70/8B5CF6/ffffff?text=R" 
                alt="VendorCity Rider" 
                width="70" 
                height="70"
                style="display: block; margin: 0 auto; border-radius: 50%; border: 3px solid white;"
              />
            <h3>${data.title}</h3>
          </div>
          <div class="content">
            <p>${data.message}</p>
            ${data.actionUrl ? `
              <p style="margin-top: 20px;">
                <a href="${data.actionUrl}" style="color: #8B5CF6; text-decoration: underline;">View Details →</a>
              </p>
            ` : ''}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VendorCity. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
};
