import { Activity, Check, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Fluoride() {
  return (
    <div className="font-sans text-gray-800 antialiased fade-in">
      <section className="hero-gradient pt-28 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <span className="text-teal-600 font-semibold tracking-wider uppercase text-sm flex items-center justify-center gap-2 mb-4">
              <Activity className="w-4 h-4" /> Enamel Defense
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-dental-900 leading-tight mb-6">
              Fluoride Application
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Strengthen your teeth and protect them against decay. Rebuild weakened enamel and reverse early signs of tooth decay.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-gray-900 mb-6">Treatment Highlights</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-teal-100 p-1 rounded-full"><Check className="w-4 h-4 text-teal-600" /></div>
                  <div>
                    <strong className="text-gray-900 block">Rebuilds Enamel</strong>
                    <span className="text-gray-600 text-sm">Mineralizes weakened areas before cavities can form.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-teal-100 p-1 rounded-full"><Check className="w-4 h-4 text-teal-600" /></div>
                  <div>
                    <strong className="text-gray-900 block">Quick & Comfortable</strong>
                    <span className="text-gray-600 text-sm">Applied as a pleasant-tasting varnish that takes only minutes.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-3xl font-bold text-gray-900 mb-4">Extra Armor for Your Teeth</h3>
                <p className="text-gray-600 leading-relaxed">
                  Professional fluoride treatments deliver a concentrated dose of minerals directly to your teeth, offering vastly superior protection compared to regular over-the-counter toothpaste alone.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-3 rounded-xl border border-teal-100">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold text-sm">2-Minute Treatment</span>
                </div>
                <div className="flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-3 rounded-xl border border-sky-100">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-semibold text-sm">Maximum Defense</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">Boost Your Dental Defense</h2>
          <p className="text-lg text-gray-600 mb-8">Add a professional fluoride treatment to your next clinic visit.</p>
          <Link to="/appointment" className="inline-flex items-center justify-center gap-2 bg-dental-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-dental-700 transition shadow-xl">
            Book Appointment <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}