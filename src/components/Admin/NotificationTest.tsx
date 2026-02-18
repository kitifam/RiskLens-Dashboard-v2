import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Mail, MessageSquare, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { testAllNotifications, getNotificationSettings } from '../../lib/notifications';
import { useLanguage } from '../../contexts/LanguageContext';

export function NotificationTest() {
  const { language } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Array<{ test: string; status: 'success' | 'error' | 'pending'; message?: string }>>([]);

  const handleTest = async () => {
    setIsRunning(true);
    setResults([]);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];

    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    console.error = (...args: any[]) => {
      logs.push(args.join(' '));
      originalError(...args);
    };

    try {
      await testAllNotifications();
      
      // Parse results from logs
      const testResults: Array<{ test: string; status: 'success' | 'error' | 'pending'; message?: string }> = [];
      
      if (logs.some(l => l.includes('MOCK EMAIL'))) {
        const settings = getNotificationSettings();
        testResults.push({ 
          test: 'Email', 
          status: 'pending', 
          message: `Mock mode - To: ${settings.testEmail} (check console)` 
        });
      } else if (logs.some(l => l.includes('Email') && l.includes('sent'))) {
        testResults.push({ test: 'Email', status: 'success', message: 'Email sent successfully' });
      } else {
        testResults.push({ test: 'Email', status: 'error', message: 'Email failed - check console' });
      }

      if (logs.some(l => l.includes('MOCK LINE'))) {
        testResults.push({ 
          test: 'LINE Text', 
          status: 'pending', 
          message: 'Mock mode - check console (CORS protection)' 
        });
      } else if (logs.some(l => l.includes('LINE') && l.includes('sent'))) {
        testResults.push({ test: 'LINE Text', status: 'success', message: 'LINE message sent successfully' });
      } else {
        testResults.push({ test: 'LINE Text', status: 'error', message: 'LINE failed - check console' });
      }

      if (logs.some(l => l.includes('MOCK RICH'))) {
        testResults.push({ 
          test: 'LINE Rich', 
          status: 'pending', 
          message: 'Mock mode - check console (CORS protection)' 
        });
      } else if (logs.some(l => l.includes('Rich Message') && l.includes('sent'))) {
        testResults.push({ test: 'LINE Rich', status: 'success', message: 'Rich message sent successfully' });
      } else {
        testResults.push({ test: 'LINE Rich', status: 'error', message: 'Rich message failed - check console' });
      }

      setResults(testResults);
    } catch (error) {
      console.error('Test error:', error);
      setResults([{ test: 'Error', status: 'error', message: String(error) }]);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setIsRunning(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-cyan-400" />
          {language === 'th' ? 'ทดสอบการส่งการแจ้งเตือน' : 'Notification Test'}
        </CardTitle>
        <p className="text-sm text-slate-400 mt-2">
          {language === 'th' 
            ? 'ทดสอบการส่ง Email และ LINE notifications ทั้งหมด' 
            : 'Test all Email and LINE notification functions'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleTest}
          disabled={isRunning}
          className="w-full bg-cyan-600 hover:bg-cyan-500"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {language === 'th' ? 'กำลังทดสอบ...' : 'Running tests...'}
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4 mr-2" />
              {language === 'th' ? 'รันการทดสอบทั้งหมด' : 'Run All Tests'}
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-semibold text-slate-300">
              {language === 'th' ? 'ผลการทดสอบ:' : 'Test Results:'}
            </h4>
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  result.status === 'success'
                    ? 'bg-emerald-950/30 border-emerald-500/30'
                    : result.status === 'error'
                    ? 'bg-red-950/30 border-red-500/30'
                    : 'bg-amber-950/30 border-amber-500/30'
                }`}
              >
                {result.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : result.status === 'error' ? (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-200">{result.test}</div>
                  {result.message && (
                    <div className="text-xs text-slate-400 mt-0.5">{result.message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
