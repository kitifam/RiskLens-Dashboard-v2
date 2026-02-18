import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { NotificationSettings } from './Admin/NotificationSettings';
import { useLanguage } from '../contexts/LanguageContext';

export function Settings() {
  const { language } = useLanguage();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            {language === 'th' ? 'ตั้งค่า' : 'Settings'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {language === 'th'
              ? 'จัดการการตั้งค่าระบบและการแจ้งเตือน'
              : 'Manage system settings and notifications'}
          </p>
        </div>
      </div>

      <NotificationSettings />
    </div>
  );
}
