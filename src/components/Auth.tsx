import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Phone, KeyRound, Loader2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function Auth() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  useEffect(() => {
    // Initialize RecaptchaVerifier
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          setError('验证码已过期，请重试');
        }
      });
    }
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic phone number validation (e.g., +8613800138000 or +1234567890)
    if (!phoneNumber.startsWith('+')) {
      setError('请输入包含国家代码的完整手机号，例如：+8613800138000');
      return;
    }

    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep('code');
    } catch (err: any) {
      console.error('SMS Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        if (err.message && err.message.includes('region')) {
          setError('当前国家/地区的短信发送未开启！请在 Firebase 控制台的 Authentication -> Settings -> SMS Region Policy 中允许向该地区发送短信。');
        } else {
          setError('手机号登录未开启！请在 Firebase 控制台的 Authentication -> Sign-in method 中启用 Phone (电话) 提供商。');
        }
      } else if (err.code === 'auth/billing-not-enabled') {
        setError('Firebase 要求绑定信用卡 (Blaze 计划) 才能发送真实短信（仍享受免费额度）。开发测试请在控制台添加“测试电话号码”以绕过此限制。');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('当前域名未授权！请在 Firebase 控制台的 Authentication -> Settings -> Authorized domains 中添加当前网页的域名。');
      } else {
        setError(err.message || '发送验证码失败，请检查手机号格式或稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setError('');
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;
      
      // Check if user exists in Firestore, if not, create a profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          createdAt: serverTimestamp()
        });
      }
      
      // Successfully logged in, App.tsx will handle the state change
    } catch (err: any) {
      console.error('Verification Error:', err);
      setError('验证码错误或已过期，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-zinc-900/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">欢迎使用 AI 视觉副驾</h1>
          <p className="text-zinc-400 text-sm">请使用手机号登录或注册</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">手机号码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+86 138 0000 0000"
                  className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">请包含国家代码，如中国大陆为 +86</p>
            </div>

            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '获取验证码'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">短信验证码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="输入 6 位验证码"
                  className="block w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">验证码已发送至 {phoneNumber}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || !verificationCode}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '验证并登录'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setVerificationCode('');
                  setError('');
                }}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
              >
                返回修改手机号
              </button>
            </div>
          </form>
        )}
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}
