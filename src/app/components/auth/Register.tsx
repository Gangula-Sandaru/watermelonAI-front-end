import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Sprout, Microscope, ChevronLeft, Loader2, Eye, EyeOff } from 'lucide-react';
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

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
  onSwitchToVerifyEmail: () => void;
}

export function Register({ onRegister, onSwitchToLogin, onSwitchToVerifyEmail }: RegisterProps) {
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [role, setRole] = useState<'farmer' | 'researcher' | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           name: name,
           username: email, // Sending email as username to satisfy some generic Django serializers
           email: email, 
           password: password,
           role: role
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        // Trigger verification email logic
        try {
          await fetch('http://127.0.0.1:8000/api/email/request-verification/', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: email })
          });
        } catch(e) {
          console.error("Verification email trigger failed", e);
        }
        
        toast.success(`Account created! Please check your email to verify your account.`);
        onSwitchToVerifyEmail();
      } else {
        toast.error(data.detail || data.error || data.username?.[0] || data.email?.[0] || 'Registration failed');
      }
    } catch (err) {
      toast.error('Network error. Ensure Django server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole: 'farmer' | 'researcher') => {
    setRole(selectedRole);
    setStep('form');
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
      
      {/* -------------------- STEP 1: ROLE SELECTION -------------------- */}
      <div 
        className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-700 ease-in-out ${
          step === 'role' 
            ? 'opacity-100 translate-y-0 scale-100 z-20' 
            : 'opacity-0 -translate-y-12 scale-95 pointer-events-none z-0'
        }`}
      >
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex justify-center mb-6 p-4 bg-white/60 backdrop-blur-md rounded-full shadow-2xl shadow-green-900/10">
               <WatermelonIcon className="w-12 h-12 text-[#2E7D32]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Join WatermelonAI</h2>
            <p className="text-lg text-gray-600 font-medium">Select how you will be participating on the platform.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <button 
              onClick={() => handleRoleSelect('farmer')}
              className="flex flex-col items-center text-center p-8 bg-white/80 backdrop-blur-xl border border-white/80 rounded-[2.5rem] hover:border-green-400 hover:bg-white transition-all duration-300 group shadow-lg hover:shadow-2xl hover:-translate-y-2 ring-1 ring-black/5"
            >
              <div className="p-6 bg-gradient-to-br from-green-100 to-green-200 text-green-700 rounded-3xl mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <Sprout className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-4">I am a Farmer</h3>
              <p className="text-gray-500 leading-relaxed px-2 font-medium">
                Monitor your crops remotely, detect diseases early with AI, and get micro-climate weather alerts.
              </p>
            </button>

            <button 
              onClick={() => handleRoleSelect('researcher')}
              className="flex flex-col items-center text-center p-8 bg-white/80 backdrop-blur-xl border border-white/80 rounded-[2.5rem] hover:border-blue-400 hover:bg-white transition-all duration-300 group shadow-lg hover:shadow-2xl hover:-translate-y-2 ring-1 ring-black/5"
            >
              <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 rounded-3xl mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <Microscope className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-4">I am a Researcher</h3>
              <p className="text-gray-500 leading-relaxed px-2 font-medium">
                Analyze aggregated agricultural data, evaluate smart-farming models, and view regional metadata.
              </p>
            </button>
          </div>

          <div className="mt-14 text-center">
            <p className="text-gray-600 font-semibold bg-white/60 inline-block px-6 py-2 rounded-full shadow-sm backdrop-blur-sm border border-white/40">
              Already have an account?{' '}
              <button 
                onClick={onSwitchToLogin}
                className="text-[#2E7D32] hover:text-green-900 transition-colors ml-1"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* -------------------- STEP 2: REGISTRATION FORM -------------------- */}
      <div 
        className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-700 ease-in-out ${
          step === 'form' 
            ? 'opacity-100 translate-y-0 scale-100 z-20' 
            : 'opacity-0 translate-y-12 scale-95 pointer-events-none z-0'
        }`}
      >
        <div className="relative max-w-[28rem] w-full bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white ring-1 ring-black/5">
          <div 
            className="absolute inset-0 z-0 opacity-5 pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage: 'url(/watermelon-bg.png)',
              backgroundSize: '150%',
              backgroundPosition: 'top right'
            }}
          />
          <div className="relative z-10 p-10">
            <button 
              onClick={() => setStep('role')}
              className="flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-8 group bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full"
            >
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-3 rounded-2xl shadow-sm ${role === 'farmer' ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-700' : 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700'}`}>
                {role === 'farmer' ? <Sprout className="w-6 h-6" /> : <Microscope className="w-6 h-6" />}
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {role === 'farmer' ? 'Farmer Setup' : 'Researcher Setup'}
              </h2>
            </div>
            <p className="text-gray-500 mb-8 font-medium">
              Create your account to configure your dashboard.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    className="pl-11 w-full px-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:bg-white focus:border-green-500 outline-none transition-all font-medium text-gray-900 shadow-sm"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

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
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="pl-11 pr-12 w-full px-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:bg-white focus:border-green-500 outline-none transition-all font-medium text-gray-900 shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 mt-8 text-white rounded-2xl transition-all font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none ${
                  role === 'farmer' ? 'bg-gradient-to-r from-[#2E7D32] to-green-600 hover:from-[#1B5E20] hover:to-green-700 shadow-green-900/20' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-900/20'
                }`}
              >
                {isLoading ? (
                  <>Processing... <Loader2 className="w-5 h-5 animate-spin" /></>
                ) : (
                  <>Create Account <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
