import React from 'react'
import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 px-4">
  
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-gray-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gray-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center">
    
          <div className="glass-panel-soft inline-flex items-center gap-2 px-4 py-2 mb-8 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-gray-300 text-sm font-medium">College Resource Booking System</span>
          </div>

       
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Book College Resources
            <br />
            <span className="text-gray-300">
              Seamlessly
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Reserve auditoriums, labs, sports facilities, and more for your college activities. 
            Submit booking requests and get admin approval in minutes.
          </p>

    
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/bookslot" 
              className="group relative px-8 py-4 bg-white text-black font-semibold text-lg overflow-hidden transition-all duration-300 hover:bg-gray-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <span className="relative z-10">Book Resource Now</span>
            </Link>
            
            <Link 
              to="/dashboard" 
              className="glass-panel-soft px-8 py-4 text-white font-semibold text-lg hover:border-white transition-all duration-300 hover:scale-105 shadow-md"
            >
              My Bookings
            </Link>
          </div>

         
        </div>
      </div>
    </section>
  )
}

export default Hero
