import { ShieldPlus, Check, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ToothFilling() {
  return (
    <div className="font-sans text-gray-800 antialiased fade-in">
      
      {/* ── Hero Section ── */}
      {/* pt-20 added to push content below your global fixed navbar */}
      <section className="hero-gradient pt-28 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-dental-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <span className="text-dental-600 font-semibold tracking-wider uppercase text-sm flex items-center justify-center gap-2 mb-4">
              <ShieldPlus className="w-4 h-4" /> Restorative Care
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-dental-900 leading-tight mb-6">
              Tooth Filling Restoration
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Restore the strength and natural appearance of your teeth. We use durable, tooth-colored composite resins to repair decay and damage seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* ── Service Details ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-gray-900 mb-6">Why Choose Composite Fillings?</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-dental-100 p-1 rounded-full"><Check className="w-4 h-4 text-dental-600" /></div>
                  <div>
                    <strong className="text-gray-900 block">Natural Appearance</strong>
                    <span className="text-gray-600 text-sm">Blends perfectly with your existing tooth color so nobody will know you had a cavity.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-dental-100 p-1 rounded-full"><Check className="w-4 h-4 text-dental-600" /></div>
                  <div>
                    <strong className="text-gray-900 block">Preserves Tooth Structure</strong>
                    <span className="text-gray-600 text-sm">Requires less removal of the healthy part of your tooth compared to traditional silver amalgam fillings.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-dental-100 p-1 rounded-full"><Check className="w-4 h-4 text-dental-600" /></div>
                  <div>
                    <strong className="text-gray-900 block">Durable & Long-lasting</strong>
                    <span className="text-gray-600 text-sm">Bonds directly to the enamel, restoring the original strength of the tooth.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-3xl font-bold text-gray-900 mb-4">The Procedure</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our filling process is quick, comfortable, and typically completed in a single visit. First, we numb the area to ensure zero pain. Then, we remove the decayed portion of the tooth, thoroughly clean the space, and apply the composite resin in layers. Finally, a special light hardens the resin instantly before we polish it to a smooth finish.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 bg-dental-50 text-dental-700 px-4 py-3 rounded-xl border border-dental-100">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold text-sm">30-45 Mins</span>
                </div>
                <div className="flex items-center gap-2 bg-accent-50 text-accent-700 px-4 py-3 rounded-xl border border-accent-100">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold text-sm">Instant Results</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">Stop Tooth Decay in its Tracks</h2>
          <p className="text-lg text-gray-600 mb-8">
            Don't let a small cavity turn into a major problem. Schedule your restoration appointment today and keep your smile healthy and pain-free.
          </p>
          <Link to="/appointment" className="inline-flex items-center justify-center gap-2 bg-dental-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-dental-700 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
            Book Your Appointment <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}