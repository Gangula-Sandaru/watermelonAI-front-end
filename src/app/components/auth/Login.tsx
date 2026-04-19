import { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';

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

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

export function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
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
        <div className="relative z-10 p-10">
          <div className="flex justify-center mb-8">
             <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-full shadow-inner">
               <WatermelonIcon className="w-10 h-10 text-[#2E7D32]" />
             </div>
          </div>
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-center text-gray-500 font-medium mb-8">Sign in to your intelligent dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  className="pl-11 w-full px-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:bg-white focus:border-green-500 outline-none transition-all font-medium text-gray-900 shadow-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-sm font-bold text-gray-700">
                  Password
                </label>
                <a href="#" className="text-sm font-bold text-[#2E7D32] hover:text-green-800 hover:underline transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  className="pl-11 w-full px-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:bg-white focus:border-green-500 outline-none transition-all font-medium text-gray-900 shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 mt-8 bg-gradient-to-r from-[#2E7D32] to-green-600 text-white rounded-2xl hover:from-[#1B5E20] hover:to-green-700 transition-all font-bold shadow-lg shadow-green-900/20 hover:shadow-xl hover:shadow-green-900/30 hover:-translate-y-0.5"
            >
              Sign In
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 text-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">
              Don't have an account?{' '}
              <button 
                onClick={onSwitchToRegister}
                className="font-bold text-[#2E7D32] hover:text-green-800 hover:underline transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
