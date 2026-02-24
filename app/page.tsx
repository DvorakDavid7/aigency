import Navbar from "@/components/landing/navbar"
import HeroSection from "@/components/landing/hero-section"
import PricingSection from "@/components/landing/pricing-section"
import Footer from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  )
}
