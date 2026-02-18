import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mail, Save, CheckCircle2, Plus, X, MessageCircle, RotateCcw } from 'lucide-react';
import {
  getNotificationSettings,
  saveNotificationSettings,
  sendTestEmailToAdmins,
  sendLineMessage,
  type NotificationSettings,
} from '../../lib/notifications';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRisks } from '../../contexts/RiskContext';
import { Toast } from '../ui/Toast';

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-cyan-500' : 'bg-slate-600'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}

export function NotificationSettings() {
  const { language } = useLanguage();
  const { resetRisks } = useRisks();
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [saved, setSaved] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [lineTestSending, setLineTestSending] = useState(false);
  const [lineTestResult, setLineTestResult] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastVariant, setToastVariant] = useState<'on' | 'off'>('on');

  useEffect(() => {
    setSettings(getNotificationSettings());
  }, []);

  const adminEmails = settings.adminEmails?.length
    ? settings.adminEmails
    : settings.adminEmail
      ? [settings.adminEmail]
      : [];

  const handleSave = () => {
    const toSave: Partial<NotificationSettings> = {
      ...settings,
      adminEmail: adminEmails[0] || settings.adminEmail,
      adminEmails: adminEmails.length ? adminEmails : undefined,
    };
    saveNotificationSettings(toSave);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addEmail = () => {
    const v = emailInput.trim();
    if (!v) return;
    const next = adminEmails.includes(v) ? adminEmails : [...adminEmails, v];
    setSettings({ ...settings, adminEmails: next, adminEmail: next[0] });
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    const next = adminEmails.filter((e) => e !== email);
    setSettings({
      ...settings,
      adminEmails: next.length ? next : undefined,
      adminEmail: next[0] || '',
    });
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setTestResult('idle');
    try {
      const ok = await sendTestEmailToAdmins();
      setTestResult(ok ? 'ok' : 'fail');
    } catch {
      setTestResult('fail');
    } finally {
      setTestSending(false);
    }
  };

  const handleSendLineTest = async () => {
    setLineTestSending(true);
    setLineTestResult('idle');
    try {
      const ok = await sendLineMessage(isTh ? '🧪 ทดสอบการแจ้งเตือนจาก RiskLens' : '🧪 Test notification from RiskLens');
      setLineTestResult(ok ? 'ok' : 'fail');
    } catch {
      setLineTestResult('fail');
    } finally {
      setLineTestSending(false);
    }
  };

  const isTh = language === 'th';

  return (
    <div className="space-y-6">
      {/* 1. ตั้งค่าการแจ้งเตือน */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-cyan-400" />
            {isTh ? 'ตั้งค่าการแจ้งเตือน' : 'Notification Settings'}
          </CardTitle>
          <p className="text-sm text-slate-400 mt-1">
            {isTh ? 'จัดการการแจ้งเตือนอัตโนมัติผ่าน Email และ Line' : 'Manage automatic notifications via Email and Line'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* เปิด/ปิด Email */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-sm font-medium text-slate-300">
                {isTh ? 'เปิด/ปิดการแจ้งเตือน Email' : 'Enable/Disable Email Notifications'}
              </p>
            </div>
            <Toggle
              checked={settings.enabled}
              onChange={(v) => {
                const next = { ...settings, enabled: v };
                setSettings(next);
                saveNotificationSettings(next);
                setToastMessage(
                  isTh
                    ? (v ? 'เปิดการแจ้งเตือน Email แล้ว' : 'ปิดการแจ้งเตือน Email แล้ว')
                    : (v ? 'Email notifications turned on' : 'Email notifications turned off')
                );
                setToastVariant(v ? 'on' : 'off');
                setToastVisible(true);
              }}
            />
          </div>
          {/* เปิด/ปิด Line */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-sm font-medium text-slate-300">
                {isTh ? 'เปิด/ปิดการแจ้งเตือน Line' : 'Enable/Disable Line Notifications'}
              </p>
            </div>
            <Toggle
              checked={settings.lineEnabled !== false}
              onChange={(v) => {
                const next = { ...settings, lineEnabled: v };
                setSettings(next);
                saveNotificationSettings(next);
                setToastMessage(
                  isTh
                    ? (v ? 'เปิดการแจ้งเตือน Line แล้ว' : 'ปิดการแจ้งเตือน Line แล้ว')
                    : (v ? 'Line notifications turned on' : 'Line notifications turned off')
                );
                setToastVariant(v ? 'on' : 'off');
                setToastVisible(true);
              }}
            />
          </div>
          {/* ปุ่มทดสอบ Line แยกจากอีเมล */}
          <div className="pt-4 mt-2 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 mb-2">
              {isTh ? 'ทดสอบการส่ง Line ไปยังกลุ่มที่ตั้งค่า' : 'Test Line message to configured group'}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSendLineTest}
              disabled={lineTestSending}
              className="inline-flex items-center gap-2 border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              {lineTestSending ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : lineTestResult === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              {lineTestSending
                ? (isTh ? 'กำลังส่ง...' : 'Sending...')
                : lineTestResult === 'ok'
                  ? (isTh ? 'ส่ง Line ทดสอบแล้ว' : 'Line sent')
                  : (isTh ? 'ส่ง Line ทดสอบ' : 'Test Line')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. ประเภทการแจ้งเตือน */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">
            {isTh ? 'ประเภทการแจ้งเตือน' : 'Notification Types'}
          </CardTitle>
          <p className="text-sm text-slate-400 mt-1">
            {isTh ? 'เลือกประเภทการแจ้งเตือนที่ต้องการรับ' : 'Select notification types to receive'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-200">
                {isTh ? 'แจ้งเตือนเมื่อมีรายการใหม่ที่ความเสี่ยงเกินค่าวิกฤต' : 'Notify when new risk exceeds critical threshold'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTh ? 'ส่งแจ้งเตือนเมื่อมีการเพิ่มความเสี่ยงใหม่และคะแนน ≥ เกณฑ์วิกฤตที่ตั้งไว้' : 'Send when a new risk is added and its score meets or exceeds the critical threshold'}
              </p>
            </div>
            <Toggle
              checked={settings.notifyOnCriticalRisk}
              onChange={(v) => {
                const next = { ...settings, notifyOnCriticalRisk: v };
                setSettings(next);
                saveNotificationSettings(next);
                setToastMessage(isTh ? (v ? 'เปิดแจ้งเตือนเมื่อมีรายการใหม่ที่ความเสี่ยงเกินค่าวิกฤต' : 'ปิดแจ้งเตือนเมื่อมีรายการใหม่ที่ความเสี่ยงเกินค่าวิกฤต') : (v ? 'New critical risk alerts on' : 'New critical risk alerts off'));
                setToastVariant(v ? 'on' : 'off');
                setToastVisible(true);
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-200">
                {isTh ? 'แจ้งเตือนเมื่อมีผู้สมัครใหม่' : 'Notify when new registration'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTh ? 'ส่งแจ้งเตือนเมื่อมีผู้ใช้สมัครใหม่รออนุมัติ' : 'Send when a new user registers and awaits approval'}
              </p>
            </div>
            <Toggle
              checked={settings.notifyOnNewRegistration}
              onChange={(v) => {
                const next = { ...settings, notifyOnNewRegistration: v };
                setSettings(next);
                saveNotificationSettings(next);
                setToastMessage(isTh ? (v ? 'เปิดแจ้งเตือนเมื่อมีผู้สมัครใหม่' : 'ปิดแจ้งเตือนเมื่อมีผู้สมัครใหม่') : (v ? 'New registration alerts on' : 'New registration alerts off'));
                setToastVariant(v ? 'on' : 'off');
                setToastVisible(true);
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-200">
                {isTh ? 'แจ้งเตือนเมื่อมีการ Escalate' : 'Notify when Escalate'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTh ? 'ส่งแจ้งเตือนเมื่อมีการกดยกระดับ (Escalate) ใน Command Center' : 'Send when a risk is escalated in Command Center'}
              </p>
            </div>
            <Toggle
              checked={settings.notifyOnDecisionRequired}
              onChange={(v) => {
                const next = { ...settings, notifyOnDecisionRequired: v };
                setSettings(next);
                saveNotificationSettings(next);
                setToastMessage(isTh ? (v ? 'เปิดแจ้งเตือนเมื่อมีการ Escalate' : 'ปิดแจ้งเตือนเมื่อมีการ Escalate') : (v ? 'Escalate alerts on' : 'Escalate alerts off'));
                setToastVariant(v ? 'on' : 'off');
                setToastVisible(true);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. อีเมลแอดมิน */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">
            {isTh ? 'อีเมลแอดมิน' : 'Admin Email'}
          </CardTitle>
          <p className="text-sm text-slate-400 mt-1">
            {isTh
              ? 'อีเมลที่จะได้รับการแจ้งเตือนเมื่อมีความเสี่ยงวิกฤตหรือผู้สมัครใหม่'
              : 'Emails that will receive critical risk and new registration notifications'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
              placeholder="admin@example.com"
              className="flex-1 bg-slate-800 border-slate-700 text-slate-200"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addEmail}
              className="shrink-0"
              title={isTh ? 'เพิ่มอีเมล' : 'Add email'}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {adminEmails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {adminEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                    aria-label={isTh ? 'ลบ' : 'Remove'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={handleSendTest}
            disabled={testSending || adminEmails.length === 0}
            className="mt-2"
          >
            {testSending ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                {isTh ? 'กำลังส่ง...' : 'Sending...'}
              </span>
            ) : testResult === 'ok' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                {isTh ? 'ส่งอีเมลทดสอบแล้ว' : 'Test email sent'}
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                {isTh ? 'ส่งอีเมลทดสอบ' : 'Send Test Email'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 4. เกณฑ์ความเสี่ยงวิกฤต */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">
            {isTh ? 'เกณฑ์ความเสี่ยงวิกฤต' : 'Critical Risk Threshold'}
          </CardTitle>
          <p className="text-sm text-slate-400 mt-1">
            {isTh
              ? 'คะแนนความเสี่ยงที่เท่ากับหรือสูงกว่าเกณฑ์นี้จะถือว่าวิกฤตและแจ้งเตือน (คะแนนสูงสุด 25)'
              : 'Risk score at or above this value is considered critical and will trigger notifications (max score 25)'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-300">
              {isTh ? 'เกณฑ์ (คะแนน)' : 'Threshold (score)'}
            </span>
            <span className="text-lg font-semibold text-cyan-400 tabular-nums">
              {settings.criticalRiskThreshold}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={25}
            value={settings.criticalRiskThreshold}
            onChange={(e) =>
              setSettings({
                ...settings,
                criticalRiskThreshold: Number(e.target.value),
              })
            }
            className="w-full h-2 rounded-lg appearance-none bg-slate-700 accent-cyan-500"
          />
          <p className="text-xs text-slate-500">
            {isTh
              ? `ถ้าคะแนนความเสี่ยง ≥ ${settings.criticalRiskThreshold} จะส่งการแจ้งเตือน`
              : `If risk score ≥ ${settings.criticalRiskThreshold}, a notification will be sent`}
          </p>
        </CardContent>
      </Card>

      {/* ข้อมูล Mock - ต่อจากเกณฑ์ความเสี่ยงวิกฤต */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">
            {isTh ? 'ข้อมูล Mock' : 'Mock Data'}
          </CardTitle>
          <p className="text-sm text-slate-400 mt-1">
            {isTh
              ? 'รีเซ็ตรายการความเสี่ยงกลับเป็นข้อมูลเริ่มต้น (สำหรับทดสอบ)'
              : 'Reset risk list to initial mock data (for testing).'}
          </p>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const message = isTh
                ? 'ต้องการรีเซ็ตข้อมูล Risk กลับเป็นข้อมูล Mock เริ่มต้นหรือไม่?'
                : 'Reset all risk data to initial mock data?';
              if (window.confirm(message)) {
                resetRisks();
                window.alert(isTh ? 'รีเซ็ตข้อมูลเป็น Mock เริ่มต้นแล้ว' : 'Data reset to initial mock data.');
              }
            }}
            className="inline-flex items-center gap-2 border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            {isTh ? 'Reset เป็น Mock เริ่มต้น' : 'Reset to initial Mock data'}
          </Button>
        </CardContent>
      </Card>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        duration={3500}
        variant={toastVariant}
      />

      {/* 5. บันทึกการตั้งค่า */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={handleSave}
          className="w-full max-w-md bg-cyan-600 hover:bg-cyan-500 text-base py-3"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {isTh ? 'บันทึกการตั้งค่าแล้ว' : 'Settings saved'}
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              {isTh ? 'บันทึกการตั้งค่า' : 'Save Settings'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
