import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { registerUser } from '../../data/mockUsers';
import { notifyAdminNewRegistration } from '../../lib/notifications';
import { useLanguage } from '../../contexts/LanguageContext';

interface RegisterFormProps {
  onSuccess: () => void;
  onLoginClick: () => void;
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessUnit: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(language === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError(language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const newUser = registerUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        businessUnit: formData.businessUnit
      });

      // Notify admin
      await notifyAdminNewRegistration(newUser);
      
      setIsSuccess(true);
    } catch (err) {
      setError(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'An error occurred. Please try again.');
    }
    
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <Card className="max-w-md mx-auto bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">
            {language === 'th' ? 'สมัครสำเร็จ!' : 'Registration Successful!'}
          </h3>
          <p className="text-slate-400 mb-6">
            {language === 'th' 
              ? 'บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากแอดมิน คุณจะได้รับอีเมลแจ้งเตือนเมื่อได้รับการอนุมัติ'
              : 'Your account is pending admin approval. You will receive an email notification once approved.'}
          </p>
          <Button onClick={onSuccess} className="w-full">
            {language === 'th' ? 'กลับไปหน้าเข้าสู่ระบบ' : 'Back to Login'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto bg-slate-900 border-slate-800">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-slate-100">
          {language === 'th' ? 'สมัครสมาชิก' : 'Register'}
        </CardTitle>
        <p className="text-sm text-slate-500 mt-2">
          {language === 'th' ? 'สร้างบัญชี RiskLens' : 'Create a RiskLens account'}
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <Input
            label={language === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Smith"
            required
          />
          
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="john@company.com"
            required
          />
          
          <Select
            label={language === 'th' ? 'หน่วยงาน' : 'Business Unit'}
            value={formData.businessUnit}
            onChange={(e) => setFormData({...formData, businessUnit: e.target.value})}
            options={[
              { value: '', label: language === 'th' ? 'เลือกหน่วยงาน' : 'Select BU' },
              { value: 'Sales', label: 'Sales' },
              { value: 'IT', label: 'IT' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Operations', label: 'Operations' },
              { value: 'HR', label: 'HR' },
            ]}
            required
          />
          
          <Input
            label={language === 'th' ? 'รหัสผ่าน' : 'Password'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="••••••••"
            required
          />
          
          <Input
            label={language === 'th' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            placeholder="••••••••"
            required
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {language === 'th' ? 'สมัครสมาชิก' : 'Register'}
          </Button>
          
          <div className="text-center text-sm text-slate-500">
            {language === 'th' ? 'มีบัญชีอยู่แล้ว?' : 'Already have an account?'}{' '}
            <button 
              type="button"
              onClick={onLoginClick}
              className="text-cyan-400 hover:underline"
            >
              {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}