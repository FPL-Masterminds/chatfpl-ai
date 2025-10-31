/**
 * Reusable email template components with ChatFPL AI branding
 */

const LOGO_URL = "https://chatfpl.ai/ChatFPL AI_Logo.png";

export function getEmailHeader() {
  return `
    <div style="background: #FFFFFF; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <img src="${LOGO_URL}" alt="ChatFPL AI" style="height: 50px; margin-bottom: 15px;" />
    </div>
  `;
}

export function getEmailFooter() {
  return `
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0;">
      <p>&copy; 2025 ChatFPL AI.ai - AI-Powered Fantasy Premier League Assistant</p>
      <p style="margin-top: 10px;">
        <a href="https://chatfpl.ai" style="color: #00FF86; text-decoration: none;">Visit Website</a> | 
        <a href="https://chatfpl.ai/terms" style="color: #00FF86; text-decoration: none;">Terms</a> | 
        <a href="https://chatfpl.ai/privacy" style="color: #00FF86; text-decoration: none;">Privacy</a>
      </p>
    </div>
  `;
}

export function wrapEmailContent(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #00FF87; color: #2E0032; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #00DD75; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailHeader()}
    <div class="content">
      ${content}
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>
  `;
}

