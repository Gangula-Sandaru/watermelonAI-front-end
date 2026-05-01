import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const WatermelonIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 10a9 9 0 0 0 18 0 Z" />
    <path d="M12 15v.01" strokeWidth="3" />
    <path d="M8 13.5v.01" strokeWidth="3" />
    <path d="M16 13.5v.01" strokeWidth="3" />
  </svg>
);

interface EmailVerificationProps {
  onSuccess: () => void;
}

export function EmailVerification({ onSuccess }: EmailVerificationProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  
  const [resendMode, setResendMode] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const emailParam = urlParams.get('email');
    const actionParam = urlParams.get('action');

    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    } else if (emailParam && actionParam === 'resend') {
      setResendEmail(emailParam);
      setResendMode(true);
      triggerResend(emailParam);
      
      // Clean up URL so it doesn't re-trigger on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const verifyToken = async (verificationToken: string) => {
    setStatus('verifying');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/email/verify-email/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken })
      });
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Your email has been verified successfully!');
        toast.success('Email verified successfully');
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification link is invalid or has expired.');
        toast.error('Verification failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Ensure the Django server is running.');
      toast.error('Network error');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      verifyToken(token);
    }
  };

  const triggerResend = async (emailToResend: string) => {
    if (resendTimer > 0) return;
    
    setIsResending(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/email/request-verification/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToResend })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Verification email sent!');
        setResendTimer(60);
        setResendMode(false);
      } else {
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      toast.error('Network error. Ensure the Django server is running.');
    } finally {
      setIsResending(false);
    }
  };

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    triggerResend(resendEmail);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-green-50/30">
      <div 
        className="absolute inset-0 z-0 opacity-[0.15] mix-blend-multiply"
        style={{
          backgroundImage: 'url(/watermelon-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      <div className="relative z-10 max-w-[28rem] w-full bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white ring-1 ring-black/5 animate-in fade-in zoom-in-[0.98] duration-700">
        <div 
          className="absolute inset-0 z-0 opacity-5 pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: 'url(/watermelon-bg.png)',
            backgroundSize: '150%',
            backgroundPosition: 'top right'
          }}
        />
        <div className="relative z-10 p-10 text-center">
          <div className="flex justify-center mb-8">
             <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-full shadow-inner">
               <WatermelonIcon className="w-10 h-10 text-[#2E7D32]" />
             </div>
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Email Verification</h2>
          
          {status === 'verifying' && (
            <div className="py-8 flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-[#2E7D32] animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 animate-in zoom-in duration-300">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-800 font-bold text-lg mb-2">Verified!</p>
              <p className="text-gray-500 mb-8">{message}</p>
              <button
                onClick={onSuccess}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#2E7D32] to-green-600 text-white rounded-2xl hover:from-[#1B5E20] hover:to-green-700 transition-all font-bold shadow-lg shadow-green-900/20 hover:-translate-y-0.5"
              >
                Proceed to Login <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6 animate-in zoom-in duration-300">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-gray-800 font-bold text-lg mb-2">Verification Failed</p>
              <p className="text-red-500 font-medium mb-8 bg-red-50 p-4 rounded-xl border border-red-100">
                {message}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setStatus('idle')}
                  className="w-full font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Try entering token manually
                </button>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setResendMode(true);
                  }}
                  className="w-full font-bold text-[#2E7D32] hover:text-[#1B5E20] transition-colors"
                >
                  Resend verification email
                </button>
              </div>
            </div>
          )}

          {status === 'idle' && !resendMode && (
            <>
              <p className="text-gray-500 font-medium mb-8">
                Please enter the verification token sent to your email address.
              </p>
              <form onSubmit={handleManualSubmit} className="space-y-5">
                <div>
                  <div className="relative group text-left">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      className="pl-11 w-full px-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:bg-white focus:border-green-500 outline-none transition-all font-medium text-gray-900 shadow-sm"
                      placeholder="Enter your verification token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!token}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 mt-8 bg-gradient-to-r from-[#2E7D32] to-green-600 text-white rounded-2xl hover:from-[#1B5E20] hover:to-green-700 transition-all font-bold shadow-lg shadow-green-900/20 hover:shadow-xl hover:shadow-green-900/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none"
                >
                  Verify Email <ArrowRight className="w-5 h-5" />
                </button>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                  {resendTimer > 0 ? (
                    <p className="text-sm font-bold text-gray-500">
                      Resend available in {resendTimer}s
                    </p>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setResendMode(true)}
                      className="text-sm font-bold text-[#2E7D32] hover:text-[#1B5E20] transition-colors"
                    >
                      Didn't receive the email? Resend
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={onSuccess}
                    className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </>
          )}

          {status === 'idle' && resendMode && (
             <>
              <p className="text-gray-500 font-medium mb-8">
                Enter your email address to receive a new verification link.
              </p>
              <form onSubmit={handleResend} className="space-y-5">
                <div>
                  <div className="relative group text-left">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      className="pl-11 w-full px-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:bg-white focus:border-green-500 outline-none transition-all font-medium text-gray-900 shadow-sm"
                      placeholder="Enter your email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!resendEmail || isResending || resendTimer > 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 mt-8 bg-gradient-to-r from-[#2E7D32] to-green-600 text-white rounded-2xl hover:from-[#1B5E20] hover:to-green-700 transition-all font-bold shadow-lg shadow-green-900/20 hover:shadow-xl hover:shadow-green-900/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isResending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                  ) : resendTimer > 0 ? (
                    `Resend in ${resendTimer}s`
                  ) : (
                    <>Send Verification Email <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                  <button 
                    type="button"
                    onClick={() => setResendMode(false)}
                    className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Back to verify token
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
