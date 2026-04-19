import { ArrowRight, Leaf, Satellite, CloudLightning, Activity, ShieldCheck, Sprout } from 'lucide-react';

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

interface LandingPageProps {
  onNavigate: (mode: 'login' | 'register') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-green-200">
      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg shadow-green-500/20">
              <WatermelonIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              WatermelonAI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-green-600 transition-colors">Features</a>
            <a href="#about" className="hover:text-green-600 transition-colors">Technology</a>
            <a href="#impact" className="hover:text-green-600 transition-colors">Impact</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('login')}
              className="text-sm font-semibold text-gray-700 hover:text-green-700 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="text-sm font-semibold px-5 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full shadow-lg shadow-green-600/30 transition-all hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Image & Overlays */}
        <div
          className="absolute top-0 left-0 w-full h-[120%] z-0"
          style={{
            backgroundImage: 'url(/hero-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'translateY(-10%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-gray-50 z-0" />
        <div className="absolute inset-0 bg-green-900/5 mix-blend-multiply z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/80 border border-green-200 text-green-800 text-sm font-medium mb-8 backdrop-blur-sm animate-fade-in-up">
            <ShieldCheck className="w-4 h-4" />
            Empowering 10,000+ farmers across South Asia
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-8 max-w-4xl mx-auto">
            The Future of Agriculture is <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400">Intelligent.</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Harness the power of AI disease diagnosis, real-time satellite monitoring, and micro-climate weather risk alerts to maximize your watermelon yields.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#2E7D32] text-white text-lg font-semibold rounded-full shadow-xl shadow-green-600/30 hover:bg-[#1B5E20] hover:shadow-2xl hover:shadow-green-600/40 transition-all hover:-translate-y-1"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 hover:text-gray-900 border border-gray-200 text-lg font-semibold rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Farm Smarter, Not Harder.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Everything you need to monitor, diagnose, and optimize your crops in one single, unified ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-green-200 transition-colors group">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Disease Diagnosis</h3>
              <p className="text-gray-600 leading-relaxed">
                Snap a photo of the affected leaf and let our custom vision models detect pests and diseases before they spread.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-green-200 transition-colors group">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Satellite className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Satellite Monitoring</h3>
              <p className="text-gray-600 leading-relaxed">
                Track NDVI, crop moisture, and general health parameters from space. Updated daily for total oversight.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-green-200 transition-colors group">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CloudLightning className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Micro-climate Alerts</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive localized warnings for frost, intense rainfall, or droughts. Protect your investment proactively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <WatermelonIcon className="w-6 h-6 text-green-500" />
            <span className="text-xl font-bold text-white">WatermelonAI</span>
          </div>
          <p>© 2026 WatermelonAI. Built with ❤️ for agriculture.</p>
        </div>
      </footer>
    </div>
  );
}
