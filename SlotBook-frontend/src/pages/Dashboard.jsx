import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import axiosInstance from '../api/axios'
import ResourceCard from '../components/ResourceCard'

const STATUS_STYLES = {
  pending: 'bg-yellow-500 text-black',
  pending_staff: 'bg-yellow-600 text-black',
  pending_admin: 'bg-orange-500 text-white',
  approved: 'bg-green-500 text-white',
  rejected: 'bg-red-500 text-white',
  cancelled: 'bg-gray-500 text-white',
}

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentResources, setRecentResources] = useState([])
  const [recentPendingBookings, setRecentPendingBookings] = useState([])
  const [recentBookedResources, setRecentBookedResources] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [userRole, setUserRole] = useState('user')
  const [userType, setUserType] = useState('')
  const [resourceCategoryStats, setResourceCategoryStats] = useState([])
  const navigate = useNavigate()

  const isAdmin = userRole === 'admin'

  const openBookingDetails = (bookingId) => {
    navigate(`/approvals/${bookingId}`)
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/dashboard/stats')
      setStats(response.data.stats)
      setRecentResources(response.data.recentResources || [])
      if (response.data.recentPendingBookings) {
        setRecentPendingBookings(response.data.recentPendingBookings)
      }
      if (response.data.recentBookedResources) {
        setRecentBookedResources(response.data.recentBookedResources)
      }
      if (response.data.resourcesByCategory) {
        setResourceCategoryStats(response.data.resourcesByCategory)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.')
        localStorage.removeItem('token')
        navigate('/login')
      } else {
        toast.error(error.response?.data?.error || 'Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const fetchMyBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const res = await axiosInstance.get('/bookings/mine')
      setMyBookings(res.data.bookings || [])
    } catch {
      toast.error('Failed to load your bookings')
    } finally {
      setBookingsLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to view dashboard')
      navigate('/login')
      return
    }

    try {
      const decoded = jwtDecode(token)
      setUserRole(decoded.role || 'user')
      setUserType(decoded.userType || '')

      fetchDashboardData()
      if (decoded.role !== 'admin') {
        fetchMyBookings()
      } else {
        setBookingsLoading(false)
      }
    } catch (error) {
      console.error('Error decoding token:', error)
      toast.error('Invalid session. Please login again.')
      localStorage.removeItem('token')
      navigate('/login')
    }
  }, [navigate, fetchDashboardData, fetchMyBookings])

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId)
    try {
      await axiosInstance.delete(`/bookings/${bookingId}`)
      toast.success('Booking cancelled')
      setMyBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled' } : b)))
      setStats((prev) =>
        prev ? { ...prev, myBookings: Math.max(0, (prev.myBookings || 1) - 1) } : prev
      )
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen app-shell text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          <p className="text-gray-300 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen app-shell text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">System-wide overview for resources, users, and bookings.</p>
            </div>
            <span className="glass-chip px-4 py-2 text-white text-sm font-semibold">ADMIN ACCESS</span>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
              <div className="glass-panel p-6">
                <p className="text-gray-400 text-sm">Total Resources</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalResources ?? 0}</p>
              </div>

              <div className="glass-panel p-6">
                <p className="text-gray-400 text-sm">Available Resources</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{stats.availableResources ?? 0}</p>
              </div>

              <div className="glass-panel p-6">
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">{stats.totalUsers ?? 0}</p>
              </div>

              <div className="glass-panel p-6">
                <p className="text-gray-400 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.totalBookings ?? 0}</p>
              </div>

              <div className="glass-panel p-6">
                <p className="text-gray-400 text-sm">Pending Approvals</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">{stats.pendingApprovals ?? 0}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 glass-panel p-6">
              <h2 className="text-2xl font-bold mb-4">System Insights</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <p className="text-sm text-gray-400">Overall Utilization</p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {stats && (stats.totalResources ?? 0) > 0
                      ? `${Math.round(((stats.availableResources ?? 0) / (stats.totalResources ?? 1)) * 100)}%`
                      : '0%'}{' '}
                    <span className="text-xs text-gray-400 font-normal">resources currently available</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-sm text-gray-400">Total Bookings (all time)</p>
                    <p className="text-xl font-semibold text-white mt-1">{stats?.totalBookings ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Pending admin approvals</p>
                    <p className="text-xl font-semibold text-orange-400 mt-1">{stats?.pendingApprovals ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Registered users</p>
                    <p className="text-xl font-semibold text-blue-400 mt-1">{stats?.totalUsers ?? 0}</p>
                  </div>
                </div>
                {resourceCategoryStats.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Top resource categories</p>
                    <p className="text-sm text-gray-200">
                      {resourceCategoryStats
                        .slice(0, 3)
                        .map((c) => `${c._id || 'Uncategorized'} (${c.count})`)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel p-6">
              <h2 className="text-2xl font-bold mb-4">Admin Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/resources')}
                  className="w-full glass-panel-soft border border-cyan-400/30 text-cyan-100 px-4 py-3 transition-all text-left hover:border-cyan-300/60 hover:bg-cyan-500/10"
                >
                  Manage resource inventory
                </button>
                <button
                  onClick={() => navigate('/approvals')}
                  className="w-full glass-panel-soft border border-amber-400/30 text-amber-100 px-4 py-3 transition-all text-left flex justify-between items-center hover:border-amber-300/60 hover:bg-amber-500/10"
                >
                  <span>Review booking approvals</span>
                  {stats?.pendingApprovals > 0 && (
                    <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1">
                      {stats.pendingApprovals}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full glass-panel-soft border border-slate-400/25 text-slate-100 px-4 py-3 transition-all text-left hover:border-slate-300/50 hover:bg-slate-500/10"
                >
                  View admin profile
                </button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recent Pending Approvals</h2>
              <button 
                onClick={() => navigate('/approvals')}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View All
              </button>
            </div>
              {recentPendingBookings.length > 0 ? (
              <div className="space-y-3">
                {recentPendingBookings.map((b) => (
                  <div key={b._id} className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold">{b.resource?.name ?? 'Unknown Resource'}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-500 text-black">
                          PENDING
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-300 flex-wrap">
                        <span>{b.date}</span>
                        <span>{b.startTime} - {b.endTime}</span>
                        <span className="text-gray-500 italic truncate max-w-xs">{b.purpose}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/approvals')}
                      className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-6 text-center">
                <p className="text-gray-400">No pending approvals require attention.</p>
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recently Booked Resources</h2>
            </div>
            {recentBookedResources.length > 0 ? (
              <div className="space-y-3">
                {recentBookedResources.map((b) => (
                  <div key={b._id} className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold">{b.resource?.name ?? 'Unknown Resource'}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 ${STATUS_STYLES[b.status] || 'bg-gray-600 text-white'}`}>
                          {(b.status || 'pending_staff').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{b.resource?.location ?? 'No location specified'}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-300 flex-wrap">
                        <span>Booked date: {b.date}</span>
                        <span>{b.startTime} - {b.endTime}</span>
                        <span className="text-gray-500">By {b.userName || b.userEmail || 'Unknown User'}</span>
                      </div>
                    </div>
                    {b.status === 'approved' && (
                      <button
                        onClick={() => openBookingDetails(b._id)}
                        className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-6 text-center">
                <p className="text-gray-400">No recent booked resources to display.</p>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recent Resources</h2>
            {recentResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recentResources.map((resource) => (
                  <ResourceCard key={resource._id} resource={resource} />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-center">
                <p className="text-gray-400">No resources available yet.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen app-shell text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold mb-2">{userType === 'staff' ? 'Staff Dashboard' : 'Student Dashboard'}</h1>
            <p className="text-gray-400">Track your bookings and quickly access resources.</p>
          </div>
          <span className="glass-chip px-4 py-2 text-gray-300 text-sm font-semibold uppercase">
            {userType || 'User'}
          </span>
        </div>

        {stats && (
          <div className={`grid grid-cols-1 md:grid-cols-${userType === 'staff' ? '4' : '3'} gap-6 mb-8`}>
            <div className="glass-panel p-6">
              <p className="text-gray-400 text-sm">Total Resources</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalResources ?? 0}</p>
            </div>

            <div className="glass-panel p-6">
              <p className="text-gray-400 text-sm">Available Resources</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.availableResources ?? 0}</p>
            </div>

            <div className="glass-panel p-6">
              <p className="text-gray-400 text-sm">My Bookings</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.myBookings ?? 0}</p>
            </div>

            {userType === 'staff' && (
              <div className="glass-panel p-6">
                <p className="text-gray-400 text-sm">Pending Staff Approvals</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">{stats.pendingApprovals ?? 0}</p>
              </div>
            )}
          </div>
        )}

        {userType === 'staff' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Student Requests (Pending)</h2>
              <button 
                onClick={() => navigate('/approvals')}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View All
              </button>
            </div>
            {recentPendingBookings.length > 0 ? (
              <div className="space-y-3">
                {recentPendingBookings.map((b) => (
                  <div key={b._id} className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold">{b.resource?.name ?? 'Unknown Resource'}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-600 text-black">
                          STAFF APPROVAL
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-300 flex-wrap">
                        <span>{b.userName || b.userEmail}</span>
                        <span>{b.date}</span>
                        <span>{b.startTime} - {b.endTime}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/approvals')}
                      className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-6 text-center">
                <p className="text-gray-400">No pending student requests.</p>
              </div>
            )}
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Bookings</h2>
            <Link to="/bookslot" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">+ New Booking</Link>
          </div>

          {bookingsLoading ? (
            <div className="flex items-center gap-3 text-gray-400 py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span className="text-sm">Loading bookings...</span>
            </div>
          ) : myBookings.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <p className="text-gray-400">You have no bookings yet.</p>
              <Link to="/bookslot" className="inline-block mt-3 px-4 py-2 bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors">
                Book a Slot
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <div key={b._id} className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-semibold">{b.resource?.name ?? '-'}</span>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5">{b.resource?.category}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 ${STATUS_STYLES[b.status] || 'bg-gray-600 text-white'}`}>
                        {(b.status || 'pending').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{b.resource?.location}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-300 flex-wrap">
                      <span>{b.date}</span>
                      <span>{b.startTime} - {b.endTime}</span>
                      <span className="text-gray-500 italic truncate max-w-xs">{b.purpose}</span>
                    </div>
                  </div>

                  {(b.status === 'pending_staff' || b.status === 'pending_admin' || b.status === 'pending' || b.status === 'approved') && (
                    <button
                      onClick={() => handleCancel(b._id)}
                      disabled={cancellingId === b._id}
                      className="shrink-0 px-4 py-2 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingId === b._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Resources</h2>
          {recentResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentResources.map((resource) => (
                <ResourceCard key={resource._id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-lg text-center">
              <p className="text-gray-400">No resources available yet.</p>
            </div>
          )}
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/resources')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 transition-colors"
            >
              Browse Resources
            </button>

            <button
              onClick={() => navigate('/bookslot')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 transition-colors"
            >
              Book a Slot
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 transition-colors"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

