import React from 'react'
import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import CTA from '../components/CTA'

const Home = () => {
  return (
    <div className="overflow-hidden">
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </div>
  )
}

export default Home
