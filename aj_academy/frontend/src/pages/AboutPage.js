import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e3a8a] text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-4 hover:text-[#f97316]">
            <ArrowLeft /> Back to Home
          </button>
          <h1 className="text-4xl font-bold">About Us</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1e3a8a] mb-4">Welcome to our Kid’s Scholar</h2>
            <p className="text-gray-700 leading-relaxed">
              Prepare for an amazing academic year packed with excitement and discovery. From thrilling experiments to fascinating debates, 
              we will immerse ourselves in a world of learning that will pique your interest and fuel your passion. Accept the challenges, 
              let your imagination run wild, and let’s make this a memorable year! Let’s work together to win this academic year!
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-[#1e3a8a] mb-4">Exploring, Growing, And Thriving Together</h2>
            <p className="text-gray-700 leading-relaxed">
              “It was a great success. The parents reflected on aspects of their parenting that are helpful and ones that might not be, 
              which helped us then practice skills that help empower rather than control learners (we all agreed that telling learners what 
              to do just doesn’t work). We explored ways to help children feel accepted and listened to by their parents, and then we practiced 
              how to have a metacognitive conversation instead of a managerial one. This meant parents practicing questions about how the learner 
              learns, is motivated, makes decisions, etc., much as a coach would, in order to help learners become aware of how they think, emote, 
              and choose. We role-played all of this to build techniques in empowering learners to self-reflect and make their own choices. 
              These are highly interactive sessions, where parents leave with skills and approaches they can put into practice right away.”
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#1e3a8a] to-blue-700 text-white rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="leading-relaxed">
              At Kid Scholars International School, we believe in nurturing young minds through a perfect blend of play and education. 
              Our Montessori-inspired approach ensures that every child develops at their own pace while building strong foundations for lifelong learning.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#f97316]/10 border border-[#f97316]/30 rounded-xl p-6">
              <h4 className="text-xl font-bold text-[#1e3a8a] mb-3">Our Values</h4>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Child-centered learning</li>
                <li>✓ Holistic development</li>
                <li>✓ Safe and nurturing environment</li>
                <li>✓ Parent partnership</li>
                <li>✓ Excellence in early education</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-xl font-bold text-[#1e3a8a] mb-3">Why Choose Us</h4>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Montessori certified teachers</li>
                <li>✓ Low student-teacher ratio</li>
                <li>✓ Activity-based curriculum</li>
                <li>✓ Daily parent updates</li>
                <li>✓ Modern infrastructure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;