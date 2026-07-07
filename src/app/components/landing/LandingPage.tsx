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
    <div className="min-h-screen bg-green-50/30 flex flex-col font-sans selection:bg-green-200 relative">
      <div 
        className="absolute inset-0 z-0 opacity-[0.15] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: 'url(/watermelon-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-green-900/10 shadow-sm">
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
        <div
          className="absolute top-0 left-0 w-full h-[130%] z-0"
          style={{
            backgroundImage: 'url(https://www.herewinpower.com/wp-content/uploads/2025/07/7c5ec43a117046fd90d3a0629881927c.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'translateY(-15%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/60 to-white/95 z-0" />
        <div className="absolute inset-0 bg-green-900/10 mix-blend-overlay z-0" />

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
            <a
              href="#features"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-md text-gray-700 hover:text-green-800 hover:bg-white border border-green-900/10 text-lg font-semibold rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-1 ring-1 ring-black/5"
            >
              Learn More
            </a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Farm Smarter, Not Harder.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Everything you need to monitor, diagnose, and optimize your crops in one single, unified ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/80 hover:border-green-400 hover:bg-white transition-all duration-300 group shadow-lg hover:shadow-2xl hover:-translate-y-2 ring-1 ring-black/5">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors">AI Disease Diagnosis</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                Snap a photo of the affected leaf and let our custom vision models detect pests and diseases before they spread.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/80 hover:border-blue-400 hover:bg-white transition-all duration-300 group shadow-lg hover:shadow-2xl hover:-translate-y-2 ring-1 ring-black/5">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Satellite className="w-7 h-7 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">Satellite Monitoring</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                Track NDVI, crop moisture, and general health parameters from space. Updated daily for total oversight.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/80 hover:border-orange-400 hover:bg-white transition-all duration-300 group shadow-lg hover:shadow-2xl hover:-translate-y-2 ring-1 ring-black/5">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CloudLightning className="w-7 h-7 text-orange-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-700 transition-colors">Micro-climate Alerts</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                Receive localized warnings for frost, intense rainfall, or droughts. Protect your investment proactively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="about" className="py-24 relative z-10 bg-white/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-sm font-bold mb-6 backdrop-blur-sm">
                Next-Gen Tech Stack
              </div>
              <h2 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Deep Learning Meets <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Orbital Intelligence</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed font-medium">
                WatermelonAI is built on a robust, high-performance architecture designed for scale and precision. By combining cutting-edge machine learning with real-time aerospace data, we deliver unparalleled accuracy directly to the farmer's mobile device.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 text-green-700 rounded-lg mt-1 shadow-sm"><Activity className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Custom Vision Neural Networks</h4>
                    <p className="text-gray-500 text-sm font-medium">Trained on thousands of verified agricultural samples to detect pathogens with 98% accuracy.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg mt-1 shadow-sm"><Satellite className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Sentinel-2 Integration</h4>
                    <p className="text-gray-500 text-sm font-medium">Automated NDVI (Normalized Difference Vegetation Index) calculation from multi-spectral satellite imagery.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-green-400 to-blue-500 rounded-[3rem] blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-white/80 rounded-[3rem] p-8 shadow-2xl ring-1 ring-black/5">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800" 
                  alt="Agricultural Technology" 
                  className="rounded-2xl w-full h-auto object-cover shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-24 relative z-10 bg-gradient-to-b from-transparent to-green-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-sm font-bold mb-6 backdrop-blur-sm">
            Global Impact
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-6">Securing the Global Food Supply</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
            Crop diseases cause devastating losses to smallholder farmers worldwide. By democratizing access to expert-level agricultural intelligence, we are directly contributing to food security and economic stability.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-lg border border-white/80 ring-1 ring-black/5">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-emerald-400 mb-4">35%</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Yield Increase</h4>
              <p className="text-gray-500 font-medium text-sm">Average improvement in crop yield for farmers actively using predictive disease mitigation.</p>
            </div>
            <div className="p-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-lg border border-white/80 ring-1 ring-black/5">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-400 mb-4">24/7</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Expert Access</h4>
              <p className="text-gray-500 font-medium text-sm">Round-the-clock automated diagnostics combined with seamless escalation to human Agri-Officers.</p>
            </div>
            <div className="p-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-lg border border-white/80 ring-1 ring-black/5">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-500 to-amber-400 mb-4">10k+</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Active Farms</h4>
              <p className="text-gray-500 font-medium text-sm">A rapidly growing community of modern, data-driven agricultural professionals worldwide.</p>
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
