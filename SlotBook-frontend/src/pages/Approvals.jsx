import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import axiosInstance from '../api/axios'

const STATUS_STYLES = {
  pending_staff: 'bg-yellow-600 text-black',
  pending_admin: 'bg-orange-500 text-white',
  approved: 'bg-green-500 text-white',
  rejected: 'bg-red-500 text-white',
  cancelled: 'bg-gray-500 text-white',
}

const Approvals = () => {
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [userRole, setUserRole] = useState('user')
  const [activeFilter, setActiveFilter] = useState('pending') // 'pending' | 'all'
  const navigate = useNavigate()

  const isAdmin = userRole === 'admin'
  const isStaff = userRole === 'staff'

  const applyFilter = useCallback(
    (allBookings, role, filter) => {
      let list = allBookings

      if (role === 'staff') {
        if (filter === 'pending') {
          list = allBookings.filter((b) => b.status === 'pending_staff')
        }
      } else if (role === 'admin') {
        if (filter === 'pending') {
          list = allBookings.filter((b) => b.status === 'pending_admin')
        }
      }

      setFilteredBookings(list)
    },
    []
  )

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/bookings')
      const all = res.data.bookings || []
      setBookings(all)
      applyFilter(all, userRole, activeFilter)
    } catch (error) {
      console.error('Error fetching bookings for approvals:', error)
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.')
        localStorage.removeItem('token')
        navigate('/login')
      } else {
        toast.error(error.response?.data?.error || 'Failed to load approvals')
      }
    } finally {
      setLoading(false)
    }
  }, [activeFilter, applyFilter, navigate, userRole])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to view approvals')
      navigate('/login')
      return
    }

    try {
      const decoded = jwtDecode(token)
      const role = decoded.role || decoded.userType || 'user'
      setUserRole(role)

      if (role !== 'admin' && role !== 'staff') {
        toast.error('You are not authorized to access approvals')
        navigate('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error decoding token:', error)
      toast.error('Invalid session. Please login again.')
      localStorage.removeItem('token')
      navigate('/login')
      return
    }
  }, [navigate])

  // Refetch when role or filter is ready/changes
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'staff') {
      fetchBookings()
    }
  }, [userRole, activeFilter, fetchBookings])

  const updateStatus = async (bookingId, nextStatus) => {
    setUpdatingId(bookingId)
    try {
      const res = await axiosInstance.patch(`/bookings/${bookingId}/status`, { status: nextStatus })
      const updated = res.data.booking
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)))
      applyFilter(
        bookings.map((b) => (b._id === bookingId ? updated : b)),
        userRole,
        activeFilter
      )
      toast.success('Booking status updated')
    } catch (error) {
      console.error('Error updating booking status:', error)
      toast.error(error.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdatingId('')
    }
  }

  const openBookingDetails = (bookingId) => {
    navigate(`/approvals/${bookingId}`)
  }

  const renderActionButtons = (booking) => {
    const isPendingStaff = booking.status === 'pending_staff'
    const isPendingAdmin = booking.status === 'pending_admin'

    if (isStaff && isPendingStaff) {
      return (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => updateStatus(booking._id, 'pending_admin')}
            disabled={updatingId === booking._id}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {updatingId === booking._id ? 'Forwarding...' : 'Forward to Admin'}
          </button>
          <button
            onClick={() => updateStatus(booking._id, 'rejected')}
            disabled={updatingId === booking._id}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {updatingId === booking._id ? 'Updating...' : 'Reject'}
          </button>
        </div>
      )
    }

    if (isAdmin && isPendingAdmin) {
      return (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => updateStatus(booking._id, 'approved')}
            disabled={updatingId === booking._id}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {updatingId === booking._id ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => updateStatus(booking._id, 'rejected')}
            disabled={updatingId === booking._id}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {updatingId === booking._id ? 'Updating...' : 'Reject'}
          </button>
        </div>
      )
    }

    return null
  }

  const formatDateTime = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleString()
  }

  return (
    <div className="min-h-screen app-shell text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Approvals</h1>
            <p className="text-gray-400 text-lg">
              Review and act on pending booking requests with clear visibility.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="glass-chip px-4 py-2 text-gray-300 text-sm font-semibold uppercase">
              {isAdmin ? 'Admin' : isStaff ? 'Staff' : 'User'} View
            </span>
          </div>
        </div>

        {(isAdmin || isStaff) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveFilter('pending')}
                className={`px-4 py-2 font-medium transition-all ${
                  activeFilter === 'pending'
                    ? 'bg-white text-black'
                    : 'glass-panel-soft text-gray-300 hover:bg-gray-700/70'
                }`}
              >
                Pending Approvals
              </button>
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-white text-black'
                    : 'glass-panel-soft text-gray-300 hover:bg-gray-700/70'
                }`}
              >
                All Relevant Bookings
              </button>
            </div>
            <div className="text-gray-400 text-sm">
              Showing <span className="text-white font-semibold">{filteredBookings.length}</span> of{' '}
              <span className="text-white font-semibold">{bookings.length}</span> bookings
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
              <p className="text-gray-300 text-sm">Loading approvals...</p>
            </div>
          </div>
        )}

        {!loading && filteredBookings.length === 0 && (
          <div className="glass-panel p-8 text-center">
            <p className="text-gray-300 text-lg mb-1">No bookings to review right now.</p>
            <p className="text-gray-500 text-sm">You will see new requests here as they arrive.</p>
          </div>
        )}

        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((b) => (
              <div
                key={b._id}
                className="glass-panel p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <span className="text-white font-semibold truncate">
                      {b.resource?.name || 'Unknown Resource'}
                    </span>
                    <span className="glass-chip text-xs text-gray-300 px-2 py-0.5">
                      {b.resource?.category || 'General'}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 ${
                        STATUS_STYLES[b.status] || 'bg-gray-600 text-white'
                      }`}
                    >
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">
                    {b.resource?.location || 'No location specified'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                    <span>
                      {b.date} 
                    </span>
                    <span>
                      {b.startTime} - {b.endTime}
                    </span>
                    <span className="text-gray-500 italic truncate max-w-xs">
                      {b.purpose}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    Requested by{' '}
                    <span className="text-gray-200 font-medium">{b.userName || b.userEmail || 'Unknown User'}</span>
                    {' '}on{' '}
                    <span className="text-gray-200 font-medium">{formatDateTime(b.createdAt)}</span>
                  </div>
                  {b.assignedStaffName && (
                    <div className="mt-1 text-sm text-gray-400">
                      Assigned staff:{' '}
                      <span className="text-gray-200 font-medium">
                        {b.assignedStaffName} ({b.assignedStaffEmail})
                      </span>
                    </div>
                  )}
                </div>

                <div className="md:w-64 flex flex-col items-stretch gap-2">
                  {renderActionButtons(b)}
                  {isAdmin && b.status === 'approved' && (
                    <button
                      onClick={() => openBookingDetails(b._id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Approvals
