import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { AlertCircle, Loader2, User } from 'lucide-react';
import { loginUser, MOCK_USERS } from '../../data/mockUsers';
import { useLanguage } from '../../contexts/LanguageContext';
import type { User as UserType } from '../../types/user';

interface LoginFormProps {
  onSuccess: () => void;
  onRegisterClick: () => void;
  /** ใช้จาก AuthContext เมื่อมี RBAC */
  loginFn?: (email: string, password: string) => UserType | null;
}

export function LoginForm({ onSuccess, onRegisterClick, loginFn }: LoginFormProps) {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fillDemoAccount = (u: UserType) => {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = (loginFn || loginUser)(email, password);
    
    if (!user) {
      setError(language === 'th' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'Invalid email or password');
    } else if (user.role === 'pending') {
      setError(language === 'th' ? 'บัญชีของคุณรอการอนุมัติจากแอดมิน' : 'Your account is pending admin approval');
    } else if (user.role === 'disabled') {
      setError(language === 'th' ? 'บัญชีของคุณถูกระงับการใช้งาน' : 'Your account has been disabled');
    } else {
      onSuccess();
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto bg-slate-900 border-slate-800">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-slate-100">
          {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
        </CardTitle>
        <p className="text-sm text-slate-500 mt-2">
          {language === 'th' ? 'เข้าสู่ระบบ RiskLens' : 'Sign in to RiskLens'}
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required
          />
          
          <Input
            label={language === 'th' ? 'รหัสผ่าน' : 'Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">
              {language === 'th' ? 'บัญชีทดสอบ (กดเพื่อกรอกอัตโนมัติ):' : 'Demo Accounts (click to fill):'}
            </p>
            <div className="flex flex-wrap gap-2">
              {MOCK_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fillDemoAccount(u)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:border-cyan-500/50 hover:text-cyan-300 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  {u.role === 'admin' ? 'Admin' : u.name}
                  {u.role === 'pending' && <span className="text-amber-400">(Pending)</span>}
                  {u.role === 'disabled' && <span className="text-red-400">(Disabled)</span>}
                </button>
              ))}
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
          </Button>
          
          <div className="text-center text-sm text-slate-500">
            {language === 'th' ? 'ยังไม่มีบัญชี?' : "Don't have an account?"}{' '}
            <button 
              type="button"
              onClick={onRegisterClick}
              className="text-cyan-400 hover:underline"
            >
              {language === 'th' ? 'สมัครสมาชิก' : 'Register'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}