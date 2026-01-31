export const emailTemplates = {
  welcome: (data) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .button { background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
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
        </div>
      </body>
    </html>
  `,

  resetPassword: (data) => `
    <!DOCTYPE html>
    <html>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <p><a href="${data.resetLink}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; display: inline-block;">
            Reset Password
          </a></p>
          <p>This link expires in 1 hour.</p>
        </div>
      </body>
    </html>
  `,

  notification: (data) => `
    <!DOCTYPE html>
    <html>
      <body>
        <div style="font-family: Arial, sans-serif;">
          <h3>${data.title}</h3>
          <p>${data.message}</p>
          ${data.actionUrl ? `<p><a href="${data.actionUrl}">View Details</a></p>` : ''}
        </div>
      </body>
    </html>
  `
};
