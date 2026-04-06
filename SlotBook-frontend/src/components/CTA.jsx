import React from 'react'
import { Link } from 'react-router-dom'

const CTA = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="glass-panel relative p-12 overflow-hidden shadow-lg">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="relative text-center">
            {/* Icon */}
            <div className="glass-panel-soft inline-flex items-center justify-center w-16 h-16 mb-6 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Book Resources?
            </h2>

            {/* Subtitle */}
            <p className="text-xl text-white text-opacity-90 mb-8 max-w-2xl mx-auto">
              Join your fellow students in seamlessly booking college resources for events, practice sessions, and academic activities
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/login" 
                className="px-8 py-4 bg-white text-black font-semibold text-lg hover:bg-gray-200 transition-all duration-300 hover:scale-105 shadow-md"
              >
                Login to Book
              </Link>
              
              <Link 
                to="/bookslot" 
                className="px-8 py-4 bg-transparent text-white font-semibold text-lg border-2 border-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 shadow-md"
              >
                View Resources
              </Link>
            </div>

            {/* Trust Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-white text-opacity-80">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">For college students and faculty • Quick approval process</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
