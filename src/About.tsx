import { 
  Building,
  Award,
  GraduationCap,
  Heart,
  Star,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';

// ─── IMPORT IMAGES HERE FOR VERCEL DEPLOYMENT ───
import clinicImg from './imports/CLINIC.jfif';
import docImg from './imports/DOC.jpg'; // Change to .jfif if your file is DOC.jfif

export default function About() {
  return (
    <div className="font-sans text-gray-800 antialiased flex flex-col">
      
      {/* ── Hero Section ── */}
      <section className="hero-gradient pt-32 pb-20 relative overflow-hidden bg-gray-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <span className="text-[#0c4a6e] font-semibold tracking-wider uppercase text-sm flex items-center justify-center gap-2 mb-4">
              <Building className="w-4 h-4" /> Our Story
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
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
              <div className="w-20 h-1 bg-[#0c4a6e] rounded-full"></div>
              <p className="text-gray-600 leading-relaxed">
                Samuela Dental Clinic was founded with a singular, clear vision: to redefine the dental experience in Polangui, Albay, and the wider Bicol region. We recognized a growing need for a dental practice that didn't just fix teeth, but prioritized patient comfort, advanced technology, and genuine compassion.
              </p>
              <p className="text-gray-600 leading-relaxed">
                What started as a small, single-chair clinic has steadily grown to serve our community better. Over the years, we’ve updated our equipment and treatments to ensure our patients receive comfortable, high-quality dental care right here at home.
              </p>
              <p className="text-gray-600 leading-relaxed font-medium">
                Today, we are proud to be a trusted partner in the oral health and beautiful smiles of countless families in our community.
              </p>
            </div>
            
            {/* ── Clinic Facility Image ── */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0c4a6e] to-sky-300 rounded-3xl transform rotate-3 opacity-20"></div>
              <div className="relative w-full h-[400px] bg-gray-100 rounded-3xl shadow-xl border-4 border-white overflow-hidden group">
                {/* USE THE IMPORTED VARIABLE HERE */}
                <img 
                  src={clinicImg} 
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start relative z-10">
              
              {/* ── Dr. Samuela Image ── */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/5] bg-gray-100 group">
                  {/* USE THE IMPORTED VARIABLE HERE */}
                  <img 
                    src={docImg} 
                    alt="Dr. Sharmane Braga Samuela" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-[#0c4a6e] font-semibold tracking-wider uppercase text-sm">Meet the Founder</span>
                  <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mt-2">Dr. Shamane Braga Samuela</h2>
                  <p className="text-xl text-gray-500 mt-2 font-medium">Lead Dentist & Clinical Director</p>
                </div>

                <div className="prose text-gray-600 leading-relaxed max-w-none">
                  <p>
                    Dr. Shamane Braga Samuela has dedicated her career to changing the way people feel about visiting the dentist. Combining exceptional clinical skills with a gentle, empathetic approach, she ensures that every patient who sits in her chair feels safe, heard, and deeply cared for.
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
                    <div className="bg-sky-50 p-3 rounded-xl shrink-0">
                      <Award className="w-6 h-6 text-[#0c4a6e]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Licensed Professional</h4>
                      <p className="text-sm text-gray-600 mt-1">Board Certified by the Professional Regulation Commission (PRC).</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-sky-50 p-3 rounded-xl shrink-0">
                      <GraduationCap className="w-6 h-6 text-[#0c4a6e]" />
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#0c4a6e] font-semibold tracking-wider uppercase text-sm">Our Philosophy</span>
            <h2 className="font-serif text-4xl font-bold text-gray-900 mt-2 mb-4">The Values We Practice By</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-gray-50 border border-gray-100 p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="bg-sky-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-[#0c4a6e]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 font-serif">Compassion</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Treating every patient with the empathy and gentleness they would afford their own family.</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="bg-sky-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-[#0c4a6e]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 font-serif">Excellence</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Committing to the highest standards of clinical precision and aesthetic outcomes.</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="bg-sky-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-[#0c4a6e]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 font-serif">Integrity</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Providing honest assessments and recommending only the treatments you truly need.</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="bg-sky-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-[#0c4a6e]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 font-serif">Innovation</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Embracing modern technology to make procedures faster, safer, and more comfortable.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}