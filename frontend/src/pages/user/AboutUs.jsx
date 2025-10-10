import React from 'react';
import Section from '../../components/user/Section.jsx';
import CaffieneLogo from '../../assets/Caffiene.png';

export default function AboutUs() {
  const team = [
    { name: 'Piyush Chundawat', role: 'Lead' },
    { name: 'Divyaraj Singh Chundawat', role: 'Member' },
    { name: 'Divaynshu Kannaujiya', role: 'Member' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="white" padding="xlarge">
        <div className="max-w-4xl mx-auto text-center">
          <img src={CaffieneLogo} alt="logo" className="mx-auto w-28 h-28 mb-4" />
          <h1 className="text-3xl font-bold mb-2">About Us</h1>
          <p className="text-gray-600 mb-2">We are the NagarSeva team — building a citizen-first municipal platform that lets residents report issues, track complaints and get faster resolutions.</p>
          <p className="text-sm text-gray-500 mb-6">Competition Team: <strong>Caffiene stack</strong> — Team ID: <strong>-670</strong></p>

          <div className="text-left bg-gray-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
            <p className="text-gray-700 mb-4">To connect citizens with municipal services through a simple, transparent and accountable digital platform.</p>

            <h2 className="text-xl font-semibold mb-3">Meet the Team</h2>
            <div className="space-y-4">
              {team.map((m, i) => (
                <div key={i} className="p-4 bg-white rounded-lg shadow-sm">
                  <h3 className="font-bold">{m.name} <span className="text-sm font-medium text-gray-500">— {m.role}</span></h3>
                  <p className="text-sm text-gray-600 mt-1">{m.bio}</p>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-3">Contact</h2>
            <p className="text-gray-700">For partnership or support, email: <a className="text-blue-600" href="mailto:hello@nagarseva.example">hello@nagarseva.example</a></p>
          </div>
        </div>
      </Section>
    </div>
  );
}