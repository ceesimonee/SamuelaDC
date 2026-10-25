import { Scan, Check, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DentalImplants() {
  return (
    <div className="font-sans text-gray-800 antialiased fade-in">
      <section className="hero-gradient pt-28 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <span className="text-emerald-600 font-semibold tracking-wider uppercase text-sm flex items-center justify-center gap-2 mb-4">
              <Scan className="w-4 h-4" /> Permanent Solutions
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-dental-900 leading-tight mb-6">
              Dental Implants
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Permanent tooth replacement solutions using titanium implants that look, feel, and function exactly like natural teeth.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-gray-900 mb-6">Why Dental Implants Are the Gold Standard</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-emerald-100 p-1 rounded-full"><Check className="w-4 h-4 text-emerald-600" /></div>
                  <div>
                    <strong className="text-gray-900 block">Prevents Bone Loss</strong>
                    <span className="text-gray-600 text-sm">Unlike bridges or dentures, implants stimulate your jawbone, keeping it strong and healthy.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-emerald-100 p-1 rounded-full"><Check className="w-4 h-4 text-emerald-600" /></div>
                  <div>
                    <strong className="text-gray-900 block">Feels Completely Natural</strong>
                    <span className="text-gray-600 text-sm">Anchored securely into your bone so they never slip, click, or feel awkward.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-3xl font-bold text-gray-900 mb-4">State-of-the-Art Precision</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our clinic uses advanced 3D imaging to map your jaw structure meticulously. The titanium post is placed with pinpoint accuracy, serving as a robust artificial root for a custom-crafted porcelain crown.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold text-sm">Permanent Lifespan</span>
                </div>
                <div className="flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-3 rounded-xl border border-sky-100">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold text-sm">Natural Look</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to Restore Your Smile?</h2>
          <p className="text-lg text-gray-600 mb-8">Book an implant consultation today and find out if you're a candidate for a permanent transformation.</p>
          <Link to="/appointment" className="inline-flex items-center justify-center gap-2 bg-dental-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-dental-700 transition shadow-xl hover:shadow-2xl">
            Book Implant Consultation <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}