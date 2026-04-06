import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axiosInstance from '../api/axios'

const Signup = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userType, setUserType] = useState('student')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    // Validate student fields
    if (userType === 'student' && (!department || !year)) {
      setError('Department and year are required for students')
      return
    }

    setLoading(true)

    try {
      const requestData = {
        name,
        email,
        password,
        userType,
        ...(userType === 'student' && { department, year })
      }

      const response = await axiosInstance.post('/auth/register', requestData)

      // Show success toast
      toast.success(response.data.message || 'Account created successfully!', {
        position: "top-right",
        autoClose: 3000,
      })
      
      // Clear form
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      
      // Redirect to login page after a brief delay
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      })
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="glass-panel shadow-lg p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-white text-black p-3 mb-4 shadow-md">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Join SlotBook and start booking resources</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-left text-sm font-semibold text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="glass-input w-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all shadow-sm"
                placeholder="John Doe"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-left text-sm font-semibold text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-input w-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all shadow-sm"
                placeholder="you@college.edu"
              />
            </div>

            {/* User Type Field */}
            <div>
              <label className="block text-left text-sm font-semibold text-gray-300 mb-2">I am a</label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                required
                className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all shadow-sm"
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {/* Department Field - Only for Students */}
            {userType === 'student' && (
              <div>
                <label className="block text-left text-sm font-semibold text-gray-300 mb-2">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all shadow-sm"
                >
                  <option value="">Select Department</option>
                  <option value="CSE">Computer Science and Engineering</option>
                  <option value="ECE">Electronics and Communication Engineering</option>
                  <option value="EEE">Electrical and Electronics Engineering</option>
                  <option value="MECH">Mechanical Engineering</option>
                  <option value="CIVIL">Civil Engineering</option>
                  <option value="IT">Information Technology</option>
                  <option value="AIDS">Artificial Intelligence and Data Science</option>
                </select>
              </div>
            )}

            {/* Year Field - Only for Students */}
            {userType === 'student' && (
              <div>
                <label className="block text-left text-sm font-semibold text-gray-300 mb-2">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all shadow-sm"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-left text-sm font-semibold text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="glass-input w-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all pr-12 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-left text-sm font-semibold text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="glass-input w-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all pr-12 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-200 font-semibold py-3 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900/70 text-gray-400">or</span>
            </div>
          </div>

          {/* Google Sign Up Button */}
          <button className="glass-panel-soft w-full flex items-center justify-center gap-2 hover:bg-gray-600/70 text-white py-3 transition-colors font-semibold shadow-sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          {/* Login Link */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:text-gray-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default Signup
