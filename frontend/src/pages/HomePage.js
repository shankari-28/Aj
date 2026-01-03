import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import NewApplicationModal from '../components/NewApplicationModal';
import CheckStatusModal from '../components/CheckStatusModal';
import LoginModal from '../components/LoginModal';

const HomePage = () => {
  const navigate = useNavigate();
  const [showNewApp, setShowNewApp] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [admissionsOpen, setAdmissionsOpen] = useState(false);

  const programs = [
    { icon: '🎨', name: 'Play Group', age: 'Age 1.5-2.5 Years', desc: 'Early learning through play' },
    { icon: '📚', name: 'Pre KG', age: 'Age 2.5-3.5 Years', desc: 'Foundation for kindergarten' },
    { icon: '🌟', name: 'LKG', age: 'Age 3.5-4.5 Years', desc: 'Lower kindergarten excellence' },
    { icon: '🚀', name: 'UKG', age: 'Age 4.5-5.5 Years', desc: 'Upper kindergarten mastery' },
    { icon: '🏫', name: 'Day Care', age: '9 AM - 8 PM', desc: 'Extended care available' },
    { icon: '⏰', name: 'After School', age: 'Post School Hours', desc: 'Activities & homework support' },
  ];

  const features = [
    { title: 'Play-Based Learning', desc: 'Holistic development through play' },
    { title: 'Experienced Faculty', desc: 'Qualified and caring teachers' },
    { title: 'Safe Environment', desc: 'CCTV monitored secure campus' },
    { title: 'Montessori Method', desc: 'International teaching standards' },
    { title: 'Daily Updates', desc: 'Parent communication portal' },
    { title: 'Individual Attention', desc: 'Low student-teacher ratio' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Strip */}
      <div className="bg-[#1e3a8a] border-b-2 border-[#f97316] text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex gap-6">
            <span>📍 Medavakkam, Chennai – 600100</span>
            <span>📞 +91 7200 82 56 92</span>
          </div>
          <span>✉️ info@kidscholars.edu.in</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="https://customer-assets.emergentagent.com/job_8188fb5c-0710-427a-be92-5f4c6acdc6fd/artifacts/bhde4pth_kid-scholars-logo.jpeg" alt="Kid Scholars" className="h-14 w-14 rounded-full object-cover" />
              <div>
                <h1 className="text-[#1e3a8a] font-bold text-xl">Kid Scholars</h1>
                <p className="text-[#f97316] text-sm font-medium">Where Play Meets Education</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/" className="text-gray-700 hover:text-[#f97316] font-medium">Home</a>
              <a href="/about" className="text-gray-700 hover:text-[#f97316] font-medium">About</a>
              <a href="#programs" className="text-gray-700 hover:text-[#f97316] font-medium">Programs</a>
              
              {/* Admissions Dropdown */}
              <div className="relative" 
                onMouseEnter={() => setAdmissionsOpen(true)}
                onMouseLeave={() => setAdmissionsOpen(false)}
              >
                <button className="text-gray-700 hover:text-[#f97316] font-medium flex items-center gap-1">
                  Admissions <ChevronDown className="w-4 h-4" />
                </button>
                {admissionsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                    <button
                      onClick={() => setShowNewApp(true)}
                      data-testid="new-application-link"
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 hover:text-[#f97316] text-gray-700 transition-colors"
                    >
                      New Application
                    </button>
                    <button
                      onClick={() => setShowStatus(true)}
                      data-testid="check-status-link"
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 hover:text-[#f97316] text-gray-700 transition-colors"
                    >
                      Already Applied
                    </button>
                    <button className="w-full text-left px-4 py-3 hover:bg-gray-50 hover:text-[#f97316] text-gray-700 transition-colors">
                      Admission FAQ
                    </button>
                  </div>
                )}
              </div>
              
              <a href="#contact" className="text-gray-700 hover:text-[#f97316] font-medium">Contact</a>
              
              {/* Buttons */}
              <button
                onClick={() => setShowLogin(true)}
                data-testid="login-button"
                className="px-6 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#1e3a8a]/90 font-medium"
              >
                Login
              </button>
              <button
                onClick={() => setShowNewApp(true)}
                data-testid="apply-now-button"
                className="px-6 py-2 bg-[#f97316] text-white rounded-md hover:bg-[#f97316]/90 font-medium"
              >
                Apply Now
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3">
              <a href="#" className="block text-gray-700 hover:text-[#f97316]">Home</a>
              <a href="#about" className="block text-gray-700 hover:text-[#f97316]">About</a>
              <a href="#programs" className="block text-gray-700 hover:text-[#f97316]">Programs</a>
              <button onClick={() => setShowNewApp(true)} className="block text-gray-700 hover:text-[#f97316]">New Application</button>
              <button onClick={() => setShowStatus(true)} className="block text-gray-700 hover:text-[#f97316]">Check Status</button>
              <button onClick={() => setShowLogin(true)} className="w-full px-6 py-2 bg-[#1e3a8a] text-white rounded-md mt-2">Login</button>
              <button onClick={() => setShowNewApp(true)} className="w-full px-6 py-2 bg-[#f97316] text-white rounded-md">Apply Now</button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a8a] via-[#1e3a8a] to-slate-900 text-white py-24">
        <div className="absolute top-10 right-10 w-64 h-64 bg-[#f97316] rounded-full opacity-20 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" data-testid="hero-heading">
            Welcome to Kid Scholars<br />International School
          </h1>
          <p className="text-lg sm:text-xl mb-8 text-gray-200">A Unit of AJ Academy Trust - Where Play Meets Education</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowNewApp(true)}
              className="px-8 py-4 bg-[#f97316] text-white rounded-lg font-semibold hover:bg-[#f97316]/90 text-lg"
            >
              New Application
            </button>
            <button
              onClick={() => setShowStatus(true)}
              className="px-8 py-4 bg-white text-[#1e3a8a] rounded-lg font-semibold hover:bg-gray-100 text-lg"
            >
              Check Application Status
            </button>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e3a8a] mb-3">Our Programs</h2>
            <div className="w-24 h-1 bg-[#f97316] mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 card-hover">
                <div className="text-5xl mb-4">{program.icon}</div>
                <h3 className="text-xl font-bold text-[#1e3a8a] mb-2">{program.name}</h3>
                <div className="inline-block px-3 py-1 bg-[#f97316] text-white text-sm rounded-full mb-3">
                  {program.age}
                </div>
                <p className="text-gray-600">{program.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e3a8a] mb-3">Why Choose Kid Scholars?</h2>
            <div className="w-24 h-1 bg-[#f97316] mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#f97316] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1e3a8a] mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Boxes */}
      <section className="py-20 bg-gradient-to-br from-[#1e3a8a] to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="text-3xl mb-3">🕐</div>
              <h3 className="font-bold text-lg mb-2">School Hours</h3>
              <p className="text-sm text-gray-200">9:00 AM – 3:00 PM<br />Extended care till 8 PM</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="font-bold text-lg mb-2">Location</h3>
              <p className="text-sm text-gray-200">4C, CCR Garden, Sri Ragavendra Apartment, MGR Road, Vignarajapuram, Medavakkam, Chennai - 600100</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="text-3xl mb-3">📞</div>
              <h3 className="font-bold text-lg mb-2">Contact Us</h3>
              <p className="text-sm text-gray-200">+91 72008 25692<br />+91 84387 11151</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="text-3xl mb-3">🌐</div>
              <h3 className="font-bold text-lg mb-2">Follow Us</h3>
              <p className="text-sm text-gray-200">@kidscholarsinternational<br />@ajacademy24</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Placeholder */}
      <section id="gallery" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1e3a8a] mb-3">Our Gallery</h2>
            <div className="w-24 h-1 bg-[#f97316] mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
                <span className="text-gray-400">Gallery Image {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-[#f97316]">Home</a></li>
              <li><a href="#about" className="hover:text-[#f97316]">About Us</a></li>
              <li><a href="#programs" className="hover:text-[#f97316]">Programs</a></li>
              <li><a href="#contact" className="hover:text-[#f97316]">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Admissions</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => setShowNewApp(true)} className="hover:text-[#f97316]">Apply Online</button></li>
              <li><button onClick={() => setShowStatus(true)} className="hover:text-[#f97316]">Check Status</button></li>
              <li><a href="#" className="hover:text-[#f97316]">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Information</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-[#f97316]">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#f97316]">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-[#f97316]">Complaint Portal</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Contact</h4>
            <p className="text-sm text-gray-400 mb-2">4C, CCR Garden, Medavakkam, Chennai - 600100</p>
            <p className="text-sm text-gray-400">+91 72008 25692</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          © 2026 Kid Scholars International School – A Unit of AJ Academy Trust. All rights reserved.
        </div>
      </footer>

      {/* Modals */}
      {showNewApp && <NewApplicationModal onClose={() => setShowNewApp(false)} />}
      {showStatus && <CheckStatusModal onClose={() => setShowStatus(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default HomePage;