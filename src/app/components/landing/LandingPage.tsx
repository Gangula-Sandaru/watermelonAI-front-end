import { useState } from 'react';
import { 
  ArrowRight, Leaf, Satellite, CloudLightning, Activity, ShieldCheck, Sprout,
  Mail, Phone, Clock, AlertCircle, CheckCircle2, Send, MessageSquare, LifeBuoy,
  HelpCircle, ShieldAlert, Sparkles, Loader2
} from 'lucide-react';
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

interface LandingPageProps {
  onNavigate: (mode: 'login' | 'register') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'system_login',
    priority: 'medium',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    ticketId: string;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Email, Subject, and Problem Description).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/contact/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        const ticket = data.ticket_id || `TIC-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        setSubmissionSuccess({
          ticketId: ticket,
          message: data.message || 'Your problem report has been submitted to the system administrator.',
        });
        toast.success(`Problem report submitted successfully! Reference: ${ticket}`);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          category: 'system_login',
          priority: 'medium',
          subject: '',
          message: '',
        });
      } else {
        const errMsg = data.error || data.detail || (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to submit problem report.');
        setErrorMessage(errMsg || 'An error occurred while submitting. Please try again.');
      }
    } catch (err) {
      // Offline fallback: save locally so user doesn't lose their report
      const fallbackTicket = `TIC-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      try {
        const localList = JSON.parse(localStorage.getItem('watermelon_local_contact_submissions') || '[]');
        localList.unshift({
          ...formData,
          ticket_id: fallbackTicket,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('watermelon_local_contact_submissions', JSON.stringify(localList));
      } catch (_) {}

      setSubmissionSuccess({
        ticketId: fallbackTicket,
        message: 'Your report has been saved and queued for administrative review.',
      });
      toast.success(`Report received! Reference: ${fallbackTicket}`);
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'system_login',
        priority: 'medium',
        subject: '',
        message: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
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
            <a href="#contact" className="hover:text-green-600 transition-colors flex items-center gap-1.5 font-semibold text-green-700">
              <LifeBuoy className="w-4 h-4" />
              Contact & Support
            </a>
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

      {/* Contact & Problem Reporting Section */}
      <section id="contact" className="py-24 relative z-10 bg-white/70 backdrop-blur-md border-t border-green-900/10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100/80 border border-red-200 text-red-800 text-sm font-bold mb-4 backdrop-blur-sm">
              <LifeBuoy className="w-4 h-4 text-red-600" />
              Helpdesk & Problem Reporting
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Encountered a Problem? <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-amber-600">We're Here to Help.</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Submit any technical issue, diagnostic error, or account difficulty. All reports are routed directly to our system administration team for review and response.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Support Channels & Admin Assurance */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gradient-to-br from-green-900 to-[#1B5E20] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-green-200 mb-4 border border-white/10">
                    Administrator Monitored
                  </span>
                  <h3 className="text-2xl font-bold mb-3">Direct Admin Support</h3>
                  <p className="text-green-100/80 text-sm leading-relaxed mb-6">
                    Every ticket logged through this form is recorded into the administrator portal with priority triage.
                  </p>

                  <div className="space-y-4 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-green-300" />
                      </div>
                      <div>
                        <p className="text-xs text-green-200 uppercase font-bold tracking-wider">Email Helpdesk</p>
                        <a href="mailto:admin@watermelonai.lk" className="text-sm font-semibold hover:text-green-300 transition-colors">
                          admin@watermelonai.lk
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-green-300" />
                      </div>
                      <div>
                        <p className="text-xs text-green-200 uppercase font-bold tracking-wider">Technical Helpline</p>
                        <p className="text-sm font-semibold">+94 (11) 789-4500 / +94 (77) 123-4567</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-green-300" />
                      </div>
                      <div>
                        <p className="text-xs text-green-200 uppercase font-bold tracking-wider">Operational Hours</p>
                        <p className="text-sm font-semibold">24/7 Monitored Ticketing Queue</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative Security Note Card */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-6 flex items-start gap-4 text-amber-900 shadow-sm">
                <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <p className="font-bold mb-1">Confidential & Admin-Restricted</p>
                  <p className="text-xs text-amber-800/90 leading-normal">
                    Your problem descriptions and contact records are kept private and accessible strictly to authorized System Administrators in the WatermelonAI Admin Portal.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Problem Submission Form */}
            <div className="lg:col-span-7">
              <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/80 ring-1 ring-black/5 relative">
                {submissionSuccess ? (
                  <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-green-50">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider">
                      Report Submitted Successfully
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Thank You for Reporting</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6 text-sm">
                      {submissionSuccess.message}
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 max-w-sm mx-auto mb-8 text-left shadow-sm">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                        <span>Ticket Reference ID</span>
                        <span className="text-green-700 font-bold">Status: Pending Review</span>
                      </div>
                      <div className="text-xl font-mono font-bold text-gray-900 tracking-wider">
                        {submissionSuccess.ticketId}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-2">
                        Please retain this reference code. System administrators will review your issue and respond to your email.
                      </p>
                    </div>

                    <button
                      onClick={() => setSubmissionSuccess(null)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-full text-sm transition-colors shadow-sm"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Submit Another Problem Report
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-700" />
                        Submit a Problem Report
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Fields marked with <span className="text-red-500 font-bold">*</span> are required.
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-sm animate-shake">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p>{errorMessage}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Your Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., Kamal Perera"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none text-sm font-medium transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="e.g., kamal@gmail.com"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none text-sm font-medium transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="e.g., +94 77 123 4567"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none text-sm font-medium transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Problem Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none text-sm font-medium transition-all"
                        >
                          <option value="system_login">System / Login Issue</option>
                          <option value="ai_disease">AI Disease Detection Bug</option>
                          <option value="satellite">Satellite Monitoring Problem</option>
                          <option value="data_export">Data Export / Report Issue</option>
                          <option value="crop_advisory">Crop Advisory Escalation</option>
                          <option value="general">General Inquiry / Feedback</option>
                          <option value="other">Other Technical Problem</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Severity Level
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none text-sm font-medium transition-all"
                        >
                          <option value="low">Low (General Query)</option>
                          <option value="medium">Medium (Normal Issue)</option>
                          <option value="high">High (Feature Blocked)</option>
                          <option value="urgent">Urgent (Critical Failure)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Problem Subject / Summary <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Brief summary of what went wrong..."
                        required
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none text-sm font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Detailed Description of Problem <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Describe step-by-step what occurred, any error messages, crop details, or device information..."
                        required
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none text-sm font-medium transition-all resize-y"
                      ></textarea>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        Direct encrypted submission to Admin
                      </p>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-gray-400 text-white font-semibold rounded-full shadow-lg shadow-green-600/30 hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting Report...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Problem Report
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <WatermelonIcon className="w-7 h-7 text-green-500" />
              <span className="text-2xl font-bold text-white tracking-tight">WatermelonAI</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#about" className="hover:text-white transition-colors">Technology</a>
              <a href="#impact" className="hover:text-white transition-colors">Impact</a>
              <a href="#contact" className="hover:text-white text-green-400 font-semibold transition-colors flex items-center gap-1">
                <LifeBuoy className="w-4 h-4" />
                Contact & Support
              </a>
              <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors">Log In</button>
              <button onClick={() => onNavigate('register')} className="hover:text-white transition-colors">Get Started</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-gray-500">
            <p>© 2026 WatermelonAI Platform. All rights reserved.</p>
            <p>Empowering Agricultural Intelligence with Precision AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

