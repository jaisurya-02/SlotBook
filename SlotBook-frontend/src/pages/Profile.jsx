import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import axiosInstance from '../api/axios'

const ACTIVE_BOOKING_STATUSES = ['pending', 'pending_staff', 'pending_admin', 'approved']
const PENDING_BOOKING_STATUSES = ['pending', 'pending_staff', 'pending_admin']

const Profile = () => {
  const [userData, setUserData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [accountStats, setAccountStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    pendingRequests: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: '',
    department: '',
    year: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to view profile')
      navigate('/login')
      return
    }

    try {
      const decoded = jwtDecode(token)
      setUserData(decoded)
      setFormData({
        name: decoded.name || 'User',
        email: decoded.email || '',
        userType: decoded.userType || '',
        department: decoded.department || '',
        year: decoded.year || ''
      })

      const fetchAccountStats = async () => {
        setStatsLoading(true)
        try {
          // Admin profile uses aggregate dashboard stats; regular users use their bookings.
          if (decoded.role === 'admin') {
            const response = await axiosInstance.get('/dashboard/stats')
            const totalBookings = response?.data?.stats?.totalBookings ?? 0
            const pendingRequests = response?.data?.stats?.pendingApprovals ?? 0

            setAccountStats({
              totalBookings,
              activeBookings: totalBookings,
              pendingRequests
            })
            return
          }

          const response = await axiosInstance.get('/bookings/mine')
          const bookings = response?.data?.bookings || []

          setAccountStats({
            totalBookings: bookings.length,
            activeBookings: bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status)).length,
            pendingRequests: bookings.filter((booking) => PENDING_BOOKING_STATUSES.includes(booking.status)).length
          })
        } catch (statsError) {
          console.error('Error fetching account statistics:', statsError)
          setAccountStats({ totalBookings: 0, activeBookings: 0, pendingRequests: 0 })
        } finally {
          setStatsLoading(false)
        }
      }

      fetchAccountStats()
    } catch (error) {
      console.error('Error decoding token:', error)
      toast.error('Invalid session. Please login again.')
      localStorage.removeItem('token')
      navigate('/login')
    }
  }, [navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    const updatedName = formData.name?.trim()

    if (!updatedName) {
      toast.error('Name cannot be empty')
      return
    }

    try {
      const response = await axiosInstance.put('/auth/profile', {
        name: updatedName
      })

      const newToken = response?.data?.token
      if (newToken) {
        localStorage.setItem('token', newToken)
        const decoded = jwtDecode(newToken)
        setUserData(decoded)
        setFormData({
          name: decoded.name || 'User',
          email: decoded.email || '',
          userType: decoded.userType || '',
          department: decoded.department || '',
          year: decoded.year || ''
        })
      } else {
        setUserData((prev) => ({
          ...prev,
          name: updatedName
        }))
        setFormData((prev) => ({
          ...prev,
          name: updatedName
        }))
      }

      toast.success(response?.data?.message || 'Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile'
      toast.error(errorMessage)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: userData.name || 'User',
      email: userData.email || '',
      userType: userData.userType || '',
      department: userData.department || '',
      year: userData.year || ''
    })
    setIsEditing(false)
  }

  if (!userData) {
    return (
      <div className="min-h-screen app-shell text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          <p className="text-gray-300 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  const isAdmin = userData.role === 'admin'

  return (
    <div className="min-h-screen app-shell text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="glass-panel shadow-lg">
          {/* Profile Header */}
          <div className="glass-panel-soft border-b border-gray-700/40 p-8">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-16 h-16 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              
              {/* Name and Role */}
              <div>
                <h2 className="text-3xl font-bold text-white">{formData.name}</h2>
                <p className="text-gray-400 mt-1">{formData.email}</p>
                {isAdmin && (
                  <span className="inline-block mt-2 px-3 py-1 bg-yellow-500 text-black text-xs font-semibold">
                    ADMIN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            {/* Edit Button */}
            {!isEditing && !isAdmin && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white text-black font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            )}
            {isAdmin && (
              <p className="mb-6 text-sm text-gray-400">Admin profile details are managed by environment configuration.</p>
            )}

            {/* Form */}
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all"
                  />
                ) : (
                  <div className="glass-panel-soft px-4 py-3 text-white">
                    {formData.name}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                <div className="glass-panel-soft px-4 py-3 text-gray-400">
                  {formData.email}
                  <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>
                </div>
              </div>

              {/* User Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">User Type</label>
                <div className="glass-panel-soft px-4 py-3 text-white capitalize">
                  {isAdmin ? 'Administrator' : formData.userType}
                </div>
              </div>

              {/* Department - Only for Students */}
              {formData.userType === 'student' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Department</label>
                  <div className="glass-panel-soft px-4 py-3 text-white">
                    {formData.department}
                  </div>
                </div>
              )}

              {/* Year - Only for Students */}
              {formData.userType === 'student' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Year</label>
                  <div className="glass-panel-soft px-4 py-3 text-white">
                    {formData.year ? `${formData.year}${formData.year === 1 ? 'st' : formData.year === 2 ? 'nd' : formData.year === 3 ? 'rd' : 'th'} Year` : ''}
                  </div>
                </div>
              )}

              {/* User ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">User ID</label>
                <div className="glass-panel-soft px-4 py-3 text-gray-400 font-mono text-sm">
                  {userData.userId}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-6 py-3 bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors border border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="glass-panel mt-6 p-6">
          <h3 className="text-xl font-bold mb-4">Account Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel-soft p-4">
              <div className="text-3xl font-bold text-indigo-400">
                {statsLoading ? '-' : accountStats.totalBookings}
              </div>
              <div className="text-gray-400 text-sm mt-1">Total Bookings</div>
            </div>
            <div className="glass-panel-soft p-4">
              <div className="text-3xl font-bold text-green-400">
                {statsLoading ? '-' : accountStats.activeBookings}
              </div>
              <div className="text-gray-400 text-sm mt-1">Active Bookings</div>
            </div>
            <div className="glass-panel-soft p-4">
              <div className="text-3xl font-bold text-yellow-400">
                {statsLoading ? '-' : accountStats.pendingRequests}
              </div>
              <div className="text-gray-400 text-sm mt-1">Pending Requests</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
