import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhatWeDo from './components/WhatWeDo';
import CarbonFootprint from './components/CarbonFootprint'; // <-- Added this
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import MouseFollower from './components/MouseFollower';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <MouseFollower />
      {/* The Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <div id="home">
        <Hero />
      </div>

      {/* About Section */}
      <div id="about">
        <WhatWeDo />
      </div>

      {/* NEW: Our Impact Section */}
      <div id="impact">
        <CarbonFootprint /> 
      </div>

      {/* How It Works Section */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* Connect / Footer Section */}
      <div id="connect">
        <Footer />
      </div>
    </main>
  );
}