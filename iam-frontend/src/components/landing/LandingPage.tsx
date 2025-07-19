import HeroSection from './HeroSection';
import AcademicSection from './AcademicSection';
import FeaturesSection from './FeaturesSection';
import DemoDashboard from './DemoDashboard';
import TechnicalSection from './TechnicalSection';
import TestimonialsSection from './TestimonialsSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <AcademicSection />
      <FeaturesSection />
      <DemoDashboard />
      <TechnicalSection />
      <TestimonialsSection />
    </div>
  );
} 