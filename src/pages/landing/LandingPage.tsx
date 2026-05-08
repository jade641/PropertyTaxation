import { useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutSection from './sections/AboutSection'
import CtaBanner from './sections/CtaBanner'
import FeaturesSection from './sections/FeaturesSection'
import Footer from './sections/Footer'
import ModulesSection from './sections/ModulesSection'
import RolesSection from './sections/RolesSection'
import StatsSection from './sections/StatsSection'

export default function LandingPage() {
  const navigate = useNavigate()
  const handleSignIn = () => navigate('/login')

  return (
    <div className="min-h-screen">
      <Navbar onSignIn={handleSignIn} />
      <Hero />
      <StatsSection />
      <FeaturesSection />
      <ModulesSection />
      <RolesSection />
      <AboutSection />
      <CtaBanner onSignIn={handleSignIn} />
      <Footer />
    </div>
  )
}
