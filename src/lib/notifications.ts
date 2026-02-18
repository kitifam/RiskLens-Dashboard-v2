// ============================================
// RISKLENS NOTIFICATION SYSTEM
// คีย์และ Token เก็บที่ Backend (Vercel Env / .env.local) เท่านั้น — ปลอดภัย
// ============================================

/** ลิงก์แอป (ใช้ใน Line / Email ปุ่ม View Dashboard เป็นต้น) */
const APP_BASE_URL = 'https://risk-lens-dashboard-v2.vercel.app';

// ============ NOTIFICATION SETTINGS (เก็บใน localStorage) ============

export interface NotificationSettings {
  adminEmail: string;
  adminEmails?: string[]; // รายการอีเมลแอดมิน (ถ้ามีใช้แทน adminEmail สำหรับส่งถึงหลายคน)
  testEmail: string;
  enabled: boolean;
  /** เปิด/ปิดการแจ้งเตือน Line */
  lineEnabled: boolean;
  /** เกณฑ์ความเสี่ยงวิกฤต (คะแนน 1–25): คะแนน >= ค่านี้ถือว่าวิกฤต */
  criticalRiskThreshold: number;
  notifyOnCriticalRisk: boolean;
  notifyOnNewRegistration: boolean;
  notifyOnDecisionRequired: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  adminEmail: 'trueh0559@gmail.com',
  adminEmails: ['trueh0559@gmail.com'],
  testEmail: 'trueh0559@gmail.com',
  enabled: true,
  lineEnabled: true,
  criticalRiskThreshold: 20,
  notifyOnCriticalRisk: true,
  notifyOnNewRegistration: true,
  notifyOnDecisionRequired: true,
};

export function getNotificationSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem('riskLens_notification_settings');
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<NotificationSettings>;
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      if (!merged.adminEmails?.length && merged.adminEmail) {
        merged.adminEmails = [merged.adminEmail];
      }
      return merged;
    }
  } catch (e) {
    console.warn('Failed to load notification settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

/** รายการอีเมลที่ใช้ส่งแจ้งเตือนถึงแอดมิน */
export function getAdminRecipients(): string[] {
  const s = getNotificationSettings();
  if (s.adminEmails?.length) return s.adminEmails.filter(Boolean);
  if (s.adminEmail) return [s.adminEmail];
  return [];
}

/** เกณฑ์คะแนนความเสี่ยงที่ถือว่าวิกฤต (คะแนน >= ค่านี้จะแจ้งเตือน) */
export function getCriticalRiskThreshold(): number {
  return getNotificationSettings().criticalRiskThreshold ?? 20;
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): void {
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('riskLens_notification_settings', JSON.stringify(updated));
    console.log('✅ Notification settings saved:', updated);
  } catch (e) {
    console.error('Failed to save notification settings:', e);
  }
}

// ============ API PROXY ============
// ส่งผ่าน /api/send-email และ /api/send-line (Vercel Serverless)
// คีย์เก็บที่ Backend เท่านั้น — ดู SETUP-NOTIFICATIONS.md สำหรับการตั้งค่า

// ============ EMAIL SERVICE (Resend) ============

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    console.log('📧 Sending email to:', to);
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Email failed:', response.status, error);
      return false;
    }
    const data = await response.json().catch(() => ({}));
    console.log('✅ Email sent!', data.id ?? '');
    return true;
  } catch (error) {
    console.error('❌ Email error:', error);
    return false;
  }
}

// ============ LINE SERVICE (Messaging API) ============

export async function sendLineMessage(message: string): Promise<boolean> {
  if (!getNotificationSettings().lineEnabled) return true;
  try {
    console.log('💬 Sending LINE message');
    const response = await fetch('/api/send-line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ LINE failed:', response.status, error);
      return false;
    }
    console.log('✅ LINE message sent!');
    return true;
  } catch (error) {
    console.error('❌ LINE error:', error);
    return false;
  }
}

// ============ HELPER: Get Group ID (One-time setup) ============

export async function getLineGroupId(): Promise<void> {
  // วิธีหา Group ID ง่ายๆ:
  // 1. ใส่ Webhook URL ใน LINE Console: https://your-app.com/webhook
  // 2. เพิ่ม Bot เข้ากลุ่ม
  // 3. ดู log ที่ source.groupId
  
  console.log('📋 To get Group ID:');
  console.log('1. Set webhook in LINE Console');
  console.log('2. Add bot to group');
  console.log('3. Check network tab for "source": {"groupId": "Cxxxxx"}');
}

// ============ RICHT MESSAGES (สวยงามขึ้น) ============

export async function sendLineRichNotification(
  title: string,
  description: string,
  actions: { label: string; uri: string }[] = []
): Promise<boolean> {
  if (!getNotificationSettings().lineEnabled) return true;

  try {
    const flexMessage = {
      type: 'flex',
      altText: title,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: title,
              weight: 'bold',
              size: 'lg',
              color: '#ffffff',
            }
          ],
          backgroundColor: '#0891b2',
          paddingAll: 'md',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: description,
              wrap: true,
              size: 'sm',
              color: '#333333',
            }
          ],
          paddingAll: 'md',
        },
        footer: actions.length > 0 ? {
          type: 'box',
          layout: 'vertical',
          contents: actions.map(action => ({
            type: 'button',
            style: 'primary',
            action: {
              type: 'uri',
              label: action.label,
              uri: action.uri,
            },
          })),
          paddingAll: 'md',
        } : undefined,
      },
    };

    const response = await fetch('/api/send-line-rich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [flexMessage] }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ LINE Rich Message failed:', error);
      return false;
    }

    console.log('✅ LINE Rich Message sent!');
    return true;
    
  } catch (error) {
    console.error('❌ LINE Rich Message error:', error);
    return false;
  }
}

// ============ NOTIFICATION TEMPLATES ============

export async function notifyAdminNewRegistration(user: {
  name: string;
  email: string;
  businessUnit: string;
  createdAt: string;
}): Promise<void> {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.notifyOnNewRegistration) return;
  const subject = `🆕 New Registration Pending: ${user.name}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #0891b2; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; color: #333; margin-top: 4px; }
        .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🆕 New User Registration</h1>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Name</div>
            <div class="value">${user.name}</div>
          </div>
          <div class="field">
            <div class="label">Email</div>
            <div class="value">${user.email}</div>
          </div>
          <div class="field">
            <div class="label">Business Unit</div>
            <div class="value">${user.businessUnit}</div>
          </div>
          <div class="field">
            <div class="label">Registered</div>
            <div class="value">${new Date(user.createdAt).toLocaleString()}</div>
          </div>
          <a href="${APP_BASE_URL}/#/admin/users" class="button">Review in Admin Panel</a>
        </div>
        <div class="footer">
          RiskLens Notification System
        </div>
      </div>
    </body>
    </html>
  `;

  // Send both - ใช้ email จาก settings
  const recipients = getAdminRecipients();
  for (const to of recipients) {
    await sendEmail(to, subject, html);
  }
  await sendLineMessage(
    `🆕 NEW REGISTRATION PENDING\n\n` +
    `👤 Name: ${user.name}\n` +
    `📧 Email: ${user.email}\n` +
    `🏢 BU: ${user.businessUnit}\n` +
    `🕐 Time: ${new Date(user.createdAt).toLocaleString()}\n\n` +
    `⚡ Please review in admin panel`
  );
}

export async function notifyUserApproved(user: {
  name: string;
  email: string;
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; text-align: center; }
        .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Account Approved!</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Your RiskLens account has been approved. You can now start reporting risks and earning points.</p>
          <a href="${APP_BASE_URL}/#/login" class="button">Login Now</a>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(user.email, '✅ Your RiskLens Account is Approved!', html);
  await sendLineMessage(`✅ APPROVED: ${user.name} can now access RiskLens`);
}

export async function notifyCriticalRisk(params: {
  title: string;
  reporterName: string;
  score: number;
  businessUnit: string;
}): Promise<void> {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.notifyOnCriticalRisk) return;
  const { title, reporterName, score, businessUnit } = params;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .alert-box { background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px; }
        .score { font-size: 48px; font-weight: bold; color: #ef4444; text-align: center; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 CRITICAL RISK ALERT</h1>
        </div>
        <div class="alert-box">
          <div class="score">${score}/25</div>
          <h2>${title}</h2>
          <p><strong>Reported by:</strong> ${reporterName} (${businessUnit})</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <a href="${APP_BASE_URL}/#/dashboard" class="button">View in Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const recipients = getAdminRecipients();
  for (const to of recipients) {
    await sendEmail(to, `🚨 CRITICAL: ${title}`, html);
  }
  await sendLineRichNotification(
    '🚨 CRITICAL RISK DETECTED',
    `${title}\n\nScore: ${score}/25\nBy: ${reporterName} (${businessUnit})\nTime: ${new Date().toLocaleString()}`,
    [
      { label: 'View Dashboard', uri: `${APP_BASE_URL}/#/dashboard` }
    ]
  );
}

export async function notifyScoreMilestone(params: {
  userName: string;
  oldBadge: string;
  newBadge: string;
  score: number;
}): Promise<void> {
  const { userName, oldBadge, newBadge, score } = params;
  
  const badgeEmojis: Record<string, string> = {
    none: '',
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
  };

  await sendLineMessage(
    `🏆 BADGE UPGRADE!\n\n` +
    `${badgeEmojis[newBadge]} ${userName}\n` +
    `${oldBadge} → ${newBadge}\n` +
    `Score: ${score} points\n\n` +
    `Congratulations! 🎉`
  );
}

/** แจ้งเตือนเมื่อมีการ Escalate ใน Command Center (ส่ง Email + Line ตามที่เปิดไว้) */
export async function notifyEscalation(params: {
  title: string;
  riskId: string;
  score: number;
  businessUnit: string;
}): Promise<void> {
  const settings = getNotificationSettings();
  const { title, riskId, score, businessUnit } = params;

  const subject = `⬆️ Escalated: ${title}`;
  const lineText =
    `⬆️ ESCALATED\n\n` +
    `${title}\n\nScore: ${score}/25 | ${businessUnit}\nRisk ID: ${riskId}\nTime: ${new Date().toLocaleString()}\n\nReview in Command Center.`;

  if (settings.enabled && settings.notifyOnDecisionRequired) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>⬆️ Risk Escalated</h1></div>
          <div class="content">
            <h2>${title}</h2>
            <p><strong>Score:</strong> ${score}/25 | <strong>Unit:</strong> ${businessUnit}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <a href="${APP_BASE_URL}/#/command" class="button">Open Command Center</a>
          </div>
        </div>
      </body>
      </html>
    `;
    const recipients = getAdminRecipients();
    for (const to of recipients) {
      await sendEmail(to, subject, html);
    }
  }

  if (settings.lineEnabled !== false && settings.notifyOnDecisionRequired) {
    await sendLineMessage(lineText);
  }
}

// ============ TEST FUNCTIONS ============

/** ส่งอีเมลทดสอบไปยังรายการอีเมลแอดมิน */
export async function sendTestEmailToAdmins(): Promise<boolean> {
  const recipients = getAdminRecipients();
  if (!recipients.length) return false;
  const html = '<h1>RiskLens</h1><p>นี่คืออีเมลทดสอบการแจ้งเตือนจากระบบ RiskLens</p>';
  for (const to of recipients) {
    await sendEmail(to, 'Test Email from RiskLens', html);
  }
  return true;
}

export async function testAllNotifications(): Promise<void> {
  console.log('');
  console.log('🧪 TESTING ALL NOTIFICATIONS');
  console.log('═══════════════════════════════════════');
  
  // Test 1: Email - ใช้ email จาก settings
  const settings = getNotificationSettings();
  console.log('\n1️⃣ Testing Email...');
  console.log('   Recipient:', settings.testEmail);
  await sendEmail(
    settings.testEmail,
    'Test Email from RiskLens',
    '<h1>Hello!</h1><p>This is a test email from RiskLens notification system.</p>'
  );
  
  // Test 2: LINE Text
  console.log('\n2️⃣ Testing LINE Text...');
  await sendLineMessage('🧪 Test message from RiskLens');
  
  // Test 3: LINE Rich
  console.log('\n3️⃣ Testing LINE Rich Message...');
  await sendLineRichNotification(
    'Test Rich Message',
    'This is a test of rich message format',
    [{ label: 'Open App', uri: APP_BASE_URL }]
  );
  
  // Test 4: Real scenarios
  console.log('\n4️⃣ Testing New Registration...');
  await notifyAdminNewRegistration({
    name: 'Test User',
    email: 'test@company.com',
    businessUnit: 'IT',
    createdAt: new Date().toISOString(),
  });
  
  console.log('\n5️⃣ Testing Critical Risk...');
  await notifyCriticalRisk({
    title: 'Server Down - Production',
    reporterName: 'John Doe',
    score: 25,
    businessUnit: 'IT',
  });
  
  console.log('\n═══════════════════════════════════════');
  console.log('✅ All tests completed!');
  console.log('Check console output above for results.');
}

// ดู SETUP-NOTIFICATIONS.md สำหรับการตั้งค่า env (Vercel / .env.local)