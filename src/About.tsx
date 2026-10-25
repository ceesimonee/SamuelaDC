import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

import { 
  Smile, 
  ChevronDown, 
  Sparkles, 
  Scan, 
  HeartPulse, 
  Baby, 
  Activity, 
  UserCircle2, 
  Menu,
  Building,
  Award,
  GraduationCap,
  Heart,
  Star,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';

export default function About() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDropOpen, setMobileDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen">
      
      {/* ── Navbar ── */}
      <nav className={`fixed w-full z-50 glass-effect border-b border-gray-100 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-dental-600 p-2 rounded-full transition transform group-hover:scale-105">
                <Smile className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-dental-900">Samuela Dental Clinic</span>
                <p className="text-xs text-dental-600 tracking-wider">DENTAL EXCELLENCE</p>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="nav-link text-gray-700 hover:text-dental-600 font-medium transition">Home</Link>
              
              <div className="relative group">
                <Link to="/#services" className="nav-link text-gray-700 hover:text-dental-600 font-medium transition flex items-center gap-1 py-2">
                  Services
                  <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                </Link>
                
                <div className="absolute top-100 left-0 w-full h-5"></div>
                
                <div className="absolute left-0 top-full mt-4 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-3 overflow-hidden">
                    <Link to="/services/cosmetic" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-dental-50 hover:text-dental-600 transition">
                      <Sparkles className="w-4 h-4" /> Cosmetic Dentistry
                    </Link>
                    <Link to="/services/implants" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-dental-50 hover:text-dental-600 transition">
                      <Scan className="w-4 h-4" /> Dental Implants
                    </Link>
                    <Link to="/services/orthodontics" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-dental-50 hover:text-dental-600 transition">
                      <Smile className="w-4 h-4" /> Orthodontics
                    </Link>
                    <Link to="/services/emergency" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-dental-50 hover:text-dental-600 transition">
                      <HeartPulse className="w-4 h-4" /> Emergency Care
                    </Link>
                    <Link to="/services/pediatric" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-dental-50 hover:text-dental-600 transition">
                      <Baby className="w-4 h-4" /> Pediatric Dentistry
                    </Link>
                    <Link to="/services/preventive" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-dental-50 hover:text-dental-600 transition">
                      <Activity className="w-4 h-4" /> Preventive Care
                    </Link>
                  </div>
                </div>
              </div>

              <Link to="/about" className="nav-link text-dental-600 font-medium transition">About</Link>
              
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <Link to="/login" className="text-gray-500 hover:text-dental-600 transition transform hover:scale-110 flex items-center" title="Login / Register">
                  <UserCircle2 className="w-7 h-7" />
                </Link>
                <Link to="/appointment" className="bg-dental-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-dental-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-block">
                  Book Appointment
                </Link>
              </div>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="w-6 h-6 text-dental-900" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <Link to="/" className="block px-3 py-2 text-gray-700 hover:bg-dental-50 rounded-md">Home</Link>
              
              <div>
                <div 
                  className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-dental-50 rounded-md cursor-pointer"
                  onClick={() => setMobileDropOpen(!mobileDropOpen)}
                >
                  <Link to="/#services" className="block flex-1" onClick={(e) => e.stopPropagation()}>Services</Link>
                  <button className="p-1">
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${mobileDropOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {mobileDropOpen && (
                  <div className="pl-6 pr-3 py-2 space-y-2 bg-gray-50/50 rounded-lg mt-1 border-l-2 border-dental-200 ml-3">
                    <Link to="/services/cosmetic" className="block px-3 py-2 text-sm text-gray-600 hover:text-dental-600 rounded-md">Cosmetic Dentistry</Link>
                    <Link to="/services/implants" className="block px-3 py-2 text-sm text-gray-600 hover:text-dental-600 rounded-md">Dental Implants</Link>
                    <Link to="/services/orthodontics" className="block px-3 py-2 text-sm text-gray-600 hover:text-dental-600 rounded-md">Orthodontics</Link>
                    <Link to="/services/emergency" className="block px-3 py-2 text-sm text-gray-600 hover:text-dental-600 rounded-md">Emergency Care</Link>
                    <Link to="/services/pediatric" className="block px-3 py-2 text-sm text-gray-600 hover:text-dental-600 rounded-md">Pediatric Dentistry</Link>
                    <Link to="/services/preventive" className="block px-3 py-2 text-sm text-gray-600 hover:text-dental-600 rounded-md">Preventive Care</Link>
                  </div>
                )}
              </div>

              <Link to="/about" className="block px-3 py-2 text-dental-600 font-medium bg-dental-50 rounded-md">About</Link>
              
              <div className="border-t border-gray-100 my-2 pt-2">
                <Link to="/login" className="block px-3 py-2 text-dental-600 font-medium hover:bg-dental-50 rounded-md flex items-center gap-2">
                  <UserCircle2 className="w-5 h-5" /> Login / Register
                </Link>
              </div>
              <Link to="/appointment" className="block text-center w-full mt-2 bg-dental-600 text-white px-6 py-3 rounded-full font-medium">Book Now</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="hero-gradient pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-dental-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <span className="text-dental-600 font-semibold tracking-wider uppercase text-sm flex items-center justify-center gap-2 mb-4">
              <Building className="w-4 h-4" /> Our Story
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-dental-900 leading-tight mb-6">
              Dedicated to Dental Excellence
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Get to know the passionate team and the history behind Polangui's premier destination for modern, gentle, and comprehensive dental care.
            </p>
          </div>
        </div>
      </section>

      {/* ── Story Section ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">How It All Started</h2>
              <div className="w-20 h-1 bg-dental-500 rounded-full"></div>
              <p className="text-gray-600 leading-relaxed">
                Samuela Dental Clinic was founded with a singular, clear vision: to redefine the dental experience in Polangui, Albay, and the wider Bicol region. We recognized a growing need for a dental practice that didn't just fix teeth, but prioritized patient comfort, advanced technology, and genuine compassion.
              </p>
              <p className="text-gray-600 leading-relaxed">
                What started as an intimate, single-chair clinic has steadily grown into a state-of-the-art facility. Over the years, we have continuously invested in the latest dental innovations—from 3D digital imaging to painless anesthesia techniques—ensuring that our patients receive world-class care right here at home.
              </p>
              <p className="text-gray-600 leading-relaxed font-medium">
                Today, we are proud to be a trusted partner in the oral health and beautiful smiles of countless families in our community.
              </p>
            </div>
            
            {/* ── Clinic Facility Image ── */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-dental-600 to-accent-500 rounded-3xl transform rotate-3 opacity-20"></div>
              <div className="relative w-full h-[400px] bg-gray-100 rounded-3xl shadow-xl border-4 border-white overflow-hidden group">
                <img 
                  src="src/imports/CLINIC.jfif" 
                  alt="Samuela Dental Clinic Facility" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Founder Section ── */}
      <section className="py-24 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 lg:p-16 border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-dental-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start relative z-10">
              
              {/* ── Dr. Samuela Image ── */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/5] bg-gray-100 group">
                  <img 
                    src="src/imports/DOC.jpg" 
                    alt="Dr. Sharmane Braga Samuela" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-dental-600 font-semibold tracking-wider uppercase text-sm">Meet the Founder</span>
                  <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mt-2">Dr. Shamane Braga Samuela</h2>
                  <p className="text-xl text-gray-500 mt-2 font-medium">Lead Dentist & Clinical Director</p>
                </div>

                <div className="prose text-gray-600 leading-relaxed max-w-none">
                  <p>
                    Dr. Sharmane Braga Samuela has dedicated her career to changing the way people feel about visiting the dentist. Combining exceptional clinical skills with a gentle, empathetic approach, she ensures that every patient who sits in her chair feels safe, heard, and deeply cared for.
                  </p>
                  <p className="mt-4">
                    Her journey into dentistry was driven by a passion for both science and artistry. After completing her rigorous academic training with top honors, Dr. Samuela successfully passed the Philippine Dental Licensure Examination, officially earning her title and license to practice. 
                  </p>
                  <p className="mt-4">
                    Since beginning her private practice, she has relentlessly pursued continuing education, staying at the forefront of modern dental techniques. Her specialized expertise spans comprehensive restorative treatments, advanced cosmetic dentistry, and gentle pediatric care. Under her leadership, Samuela Dental Clinic has become synonymous with precision, hygiene, and outstanding aesthetic results.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-6 mt-6 border-t border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="bg-dental-50 p-3 rounded-xl shrink-0">
                      <Award className="w-6 h-6 text-dental-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Licensed Professional</h4>
                      <p className="text-sm text-gray-600 mt-1">Board Certified by the Professional Regulation Commission (PRC).</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-accent-50 p-3 rounded-xl shrink-0">
                      <GraduationCap className="w-6 h-6 text-accent-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Continuous Learner</h4>
                      <p className="text-sm text-gray-600 mt-1">Regularly attends seminars on the latest cosmetic and restorative techniques.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Philosophy Section ── */}
      <section className="py-20 bg-dental-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-dental-300 font-semibold tracking-wider uppercase text-sm">Our Philosophy</span>
            <h2 className="font-serif text-4xl font-bold mt-2 mb-4">The Values We Practice By</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-dental-800 p-8 rounded-2xl hover:bg-dental-700 transition">
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-accent-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Compassion</h3>
              <p className="text-dental-200 text-sm leading-relaxed">Treating every patient with the empathy and gentleness they would afford their own family.</p>
            </div>
            
            <div className="bg-dental-800 p-8 rounded-2xl hover:bg-dental-700 transition">
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Excellence</h3>
              <p className="text-dental-200 text-sm leading-relaxed">Committing to the highest standards of clinical precision and aesthetic outcomes.</p>
            </div>
            
            <div className="bg-dental-800 p-8 rounded-2xl hover:bg-dental-700 transition">
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-dental-300" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Integrity</h3>
              <p className="text-dental-200 text-sm leading-relaxed">Providing honest assessments and recommending only the treatments you truly need.</p>
            </div>
            
            <div className="bg-dental-800 p-8 rounded-2xl hover:bg-dental-700 transition">
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Innovation</h3>
              <p className="text-dental-200 text-sm leading-relaxed">Embracing modern technology to make procedures faster, safer, and more comfortable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Smile className="w-8 h-8 text-dental-400" />
                <span className="font-serif text-2xl font-bold">Samuela Dental Clinic</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                Providing world-class dental care with a gentle touch. Your comfort and health are our top priorities.
              </p>
              <div className="flex gap-4 mt-6">
                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition">
                  <FaFacebook className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition">
                  <FaInstagram className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition">
                  <FaTwitter className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/" className="hover:text-white transition">Home</Link></li>
                <li><Link to="/#services" className="hover:text-white transition">Our Services</Link></li>
                <li><Link to="/about" className="text-white transition">About Us</Link></li>
                <li><Link to="/#contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/services/cosmetic" className="hover:text-white transition">Cosmetic Dentistry</Link></li>
                <li><Link to="/services/implants" className="hover:text-white transition">Dental Implants</Link></li>
                <li><Link to="/services/orthodontics" className="hover:text-white transition">Orthodontics</Link></li>
                <li><Link to="/services/emergency" className="hover:text-white transition">Emergency Care</Link></li>
                <li><Link to="/services/pediatric" className="hover:text-white transition">Pediatric Dentistry</Link></li>
                <li><Link to="/services/preventive" className="hover:text-white transition">Preventive Care</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© 2024 Samuela Dental Clinic. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}