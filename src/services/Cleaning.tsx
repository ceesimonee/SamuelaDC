import { Sparkles, Check, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cleaning() {
  return (
    <div className="font-sans text-gray-800 antialiased fade-in">
      <section className="hero-gradient pt-28 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <span className="text-purple-600 font-semibold tracking-wider uppercase text-sm flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" /> Preventive Care
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-dental-900 leading-tight mb-6">
              Cleaning & Prophylaxis
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Maintain a bright, healthy smile and prevent gum disease with our thorough, professional dental cleaning services.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-gray-900 mb-6">What to Expect During Your Visit</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-purple-100 p-1 rounded-full"><Check className="w-4 h-4 text-purple-600" /></div>
                  <div>
                    <strong className="text-gray-900 block">Plaque & Tartar Removal</strong>
                    <span className="text-gray-600 text-sm">Gentle ultrasonic scaling to clear away hardened deposits regular brushing can't reach.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-purple-100 p-1 rounded-full"><Check className="w-4 h-4 text-purple-600" /></div>
                  <div>
                    <strong className="text-gray-900 block">Polishing & Fluoride</strong>
                    <span className="text-gray-600 text-sm">Removes surface stains and protects your freshly cleaned enamel.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-3xl font-bold text-gray-900 mb-4">Keep Your Gums Healthy</h3>
                <p className="text-gray-600 leading-relaxed">
                  Professional prophylaxis is recommended every 6 months to prevent gingivitis, bad breath, and unexpected tooth decay. Our team ensures a relaxing, pain-free clean.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-3 rounded-xl border border-purple-100">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold text-sm">30 Mins Procedure</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-semibold text-sm">Prevents Disease</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">Due for Your Checkup?</h2>
          <p className="text-lg text-gray-600 mb-8">Keep your pearly whites shining bright. Book your routine cleaning today.</p>
          <Link to="/appointment" className="inline-flex items-center justify-center gap-2 bg-dental-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-dental-700 transition shadow-xl">
            Book Cleaning Session <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}