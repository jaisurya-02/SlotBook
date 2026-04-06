import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import axiosInstance from '../api/axios'

const STATUS_META = {
  pending_staff: {
    label: 'Pending Staff Review',
    chip: 'bg-yellow-600 text-black',
    tone: 'text-yellow-300',
  },
  pending_admin: {
    label: 'Pending Admin Review',
    chip: 'bg-orange-500 text-white',
    tone: 'text-orange-300',
  },
  approved: {
    label: 'Approved',
    chip: 'bg-green-600 text-white',
    tone: 'text-green-300',
  },
  rejected: {
    label: 'Rejected',
    chip: 'bg-red-600 text-white',
    tone: 'text-red-300',
  },
  cancelled: {
    label: 'Cancelled',
    chip: 'bg-gray-600 text-white',
    tone: 'text-gray-300',
  },
}

const roleCanReview = (role) => role === 'admin' || role === 'staff'

const toTimestamp = (value) => {
  if (!value) return 0
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

const relativeTime = (isoString) => {
  if (!isoString) return 'just now'
  const now = Date.now()
  const then = new Date(isoString).getTime()
  if (Number.isNaN(then)) return 'just now'

  const diffInSeconds = Math.max(1, Math.floor((now - then) / 1000))

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

const Notifications = () => {
  const [userRole, setUserRole] = useState('user')
  const [myBookings, setMyBookings] = useState([])
  const [reviewBookings, setReviewBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem('notificationReadIds')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('notificationReadIds', JSON.stringify(readIds))
  }, [readIds])

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      toast.error('Please login to view notifications')
      navigate('/login')
      return
    }

    try {
      const decoded = jwtDecode(token)
      const role = decoded.role || decoded.userType || 'user'
      setUserRole(role)
    } catch (error) {
      console.error('Error decoding token:', error)
      toast.error('Invalid session. Please login again.')
      localStorage.removeItem('token')
      navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const myRes = await axiosInstance.get('/bookings/mine')
        setMyBookings(myRes.data.bookings || [])

        if (roleCanReview(userRole)) {
          const reviewRes = await axiosInstance.get('/bookings')
          setReviewBookings(reviewRes.data.bookings || [])
        }
      } catch (error) {
        console.error('Error loading notifications:', error)
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.')
          localStorage.removeItem('token')
          navigate('/login')
        } else {
          toast.error(error.response?.data?.error || 'Failed to load notifications')
        }
      } finally {
        setLoading(false)
      }
    }

    if (userRole) {
      loadNotifications()
    }
  }, [navigate, userRole])

  const notifications = useMemo(() => {
    const ownStatusUpdates = (myBookings || []).map((b) => ({
      id: `mine-${b._id}`,
      source: 'my-booking',
      bookingId: b._id,
      title: `Booking update: ${b.resource?.name || 'Unknown Resource'}`,
      body: `Status changed to ${STATUS_META[b.status]?.label || b.status}.`,
      status: b.status,
      dateLabel: `${b.date} ${b.startTime} - ${b.endTime}`,
      occurredAt: b.updatedAt || b.createdAt,
      actionPath: '/dashboard',
    }))

    const reviewAlerts = roleCanReview(userRole)
      ? (reviewBookings || [])
          .filter((b) => (userRole === 'admin' ? b.status === 'pending_admin' : b.status === 'pending_staff'))
          .map((b) => ({
            id: `review-${b._id}`,
            source: 'review-queue',
            bookingId: b._id,
            title: `Action required: ${b.resource?.name || 'Unknown Resource'}`,
            body:
              userRole === 'admin'
                ? 'A booking is waiting for admin approval.'
                : 'A booking is waiting for your staff review.',
            status: b.status,
            dateLabel: `${b.date} ${b.startTime} - ${b.endTime}`,
            occurredAt: b.createdAt,
            actionPath: '/approvals',
          }))
      : []

    return [...reviewAlerts, ...ownStatusUpdates].sort(
      (a, b) => toTimestamp(b.occurredAt) - toTimestamp(a.occurredAt)
    )
  }, [myBookings, reviewBookings, userRole])

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  const visibleNotifications = showUnreadOnly
    ? notifications.filter((n) => !readIds.includes(n.id))
    : notifications

  const markAllRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev)
      notifications.forEach((n) => next.add(n.id))
      return Array.from(next)
    })
  }

  const toggleRead = (id) => {
    setReadIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  if (loading) {
    return (
      <div className="min-h-screen app-shell text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          <p className="text-gray-300 text-sm">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen app-shell text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Notifications</h1>
            <p className="text-gray-400 text-lg">Track booking updates and required actions in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="glass-chip px-3 py-2 text-sm text-gray-300">
              Unread: <span className="text-white font-semibold">{unreadCount}</span>
            </span>
            <button
              onClick={() => setShowUnreadOnly((v) => !v)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                showUnreadOnly
                  ? 'bg-white text-black'
                  : 'glass-panel-soft text-gray-300 hover:bg-gray-700/70'
              }`}
            >
              {showUnreadOnly ? 'Showing Unread' : 'Show Unread Only'}
            </button>
            <button
              onClick={markAllRead}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              Mark All Read
            </button>
          </div>
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-gray-200 text-lg mb-1">No notifications found.</p>
            <p className="text-gray-500 text-sm">
              {showUnreadOnly ? 'All caught up. No unread notifications.' : 'New booking activity will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleNotifications.map((n) => {
              const isRead = readIds.includes(n.id)
              const statusMeta = STATUS_META[n.status] || {
                label: n.status,
                chip: 'bg-gray-700 text-white',
                tone: 'text-gray-300',
              }

              return (
                <div
                  key={n.id}
                  className={`border p-5 transition-colors ${
                    isRead
                      ? 'glass-panel-soft border-slate-700/30'
                      : 'glass-panel shadow-[0_0_0_1px_rgba(255,255,255,0.04)]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-white truncate">{n.title}</h2>
                        {!isRead && <span className="w-2 h-2 bg-red-500"></span>}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{n.dateLabel}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 font-semibold ${statusMeta.chip}`}>{statusMeta.label}</span>
                      <span className="text-gray-500">{relativeTime(n.occurredAt)}</span>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 ${statusMeta.tone}`}>{n.body}</p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => navigate(n.actionPath)}
                      className="px-4 py-2 bg-white text-black hover:bg-gray-200 text-sm font-semibold transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => toggleRead(n.id)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
                    >
                      {isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
