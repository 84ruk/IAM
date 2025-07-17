import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import DemoDashboard from './DemoDashboard';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <DemoDashboard />
      <PricingSection />
      <TestimonialsSection />
    </div>
  );
} 