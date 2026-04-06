import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import axiosInstance from '../api/axios'

const SESSION_SLOTS = [
  { key: 'FN', label: 'FN (09:00 - 13:00)', startTime: '09:00', endTime: '13:00' },
  { key: 'AN', label: 'AN (13:00 - 17:00)', startTime: '13:00', endTime: '17:00' },
  { key: 'EVENING', label: 'Evening (17:00 - 21:00)', startTime: '17:00', endTime: '21:00' },
]

const CATEGORY_COLORS = {
  Classroom: 'bg-blue-600',
  Lab: 'bg-purple-600',
  Hall: 'bg-yellow-600',
  'Sports Facility': 'bg-green-600',
  Equipment: 'bg-orange-600',
  'Open Ground': 'bg-teal-600',
  Other: 'bg-gray-600',
}

const BookSlot = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const resourceIdFromUrl = searchParams.get('resource')

  const [resources, setResources] = useState([])
  const [selectedResourceId, setSelectedResourceId] = useState(resourceIdFromUrl || '')
  const [resource, setResource] = useState(null)
  const [resourceLoading, setResourceLoading] = useState(false)

  const [userType, setUserType] = useState('')
  const [staffList, setStaffList] = useState([])
  const [selectedStaffId, setSelectedStaffId] = useState('')

  const [date, setDate] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [purpose, setPurpose] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [booking, setBooking] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to book a slot')
      navigate('/login')
      return
    }
    try {
      const decoded = jwtDecode(token)
      setUserType(decoded.userType || decoded.role || '')
    } catch {
      toast.error('Invalid session. Please login again.')
      localStorage.removeItem('token')
      navigate('/login')
    }
  }, [navigate])

  // Fetch all resources for the dropdown (only when no resource pre-selected)
  useEffect(() => {
    if (!resourceIdFromUrl) {
      axiosInstance.get('/resources')
        .then(r => setResources(r.data.resources || []))
        .catch(() => toast.error('Failed to fetch resources'))
    }
  }, [resourceIdFromUrl])

  // Fetch staff list for student bookings so they can choose who approves
  useEffect(() => {
    if (userType !== 'student') return

    axiosInstance.get('/auth/staff')
      .then((r) => {
        setStaffList(r.data.staff || [])
      })
      .catch((error) => {
        console.error('Failed to fetch staff list', error)
        toast.error('Failed to load staff list')
      })
  }, [userType])

  // Fetch selected resource details
  useEffect(() => {
    if (!selectedResourceId) {
      setResource(null)
      return
    }
    setResourceLoading(true)
    axiosInstance.get(`/resources/${selectedResourceId}`)
      .then(r => setResource(r.data.resource))
      .catch(() => {
        toast.error('Failed to load resource details')
        setResource(null)
      })
      .finally(() => setResourceLoading(false))
  }, [selectedResourceId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedResourceId) {
      toast.error('Please select a resource')
      return
    }
    if (!date || !selectedSession || !purpose.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    const selectedSessionData = SESSION_SLOTS.find((slot) => slot.key === selectedSession)
    if (!selectedSessionData) {
      toast.error('Please choose a valid time slot')
      return
    }

    if (userType === 'student' && !selectedStaffId) {
      toast.error('Please select the staff member who should approve this booking')
      return
    }

    setSubmitting(true)
    try {
      const response = await axiosInstance.post('/bookings', {
        resourceId: selectedResourceId,
        date,
        startTime: selectedSessionData.startTime,
        endTime: selectedSessionData.endTime,
        purpose: purpose.trim(),
        staffId: userType === 'student' ? selectedStaffId : undefined,
      })
      setBooking(response.data.booking)
      setSubmitted(true)
      toast.success('Booking submitted successfully!')
    } catch (error) {
      const msg = error.response?.data?.error || 'Booking failed. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted && booking) {
    return (
      <div className="min-h-screen app-shell text-white flex items-center justify-center px-4 py-12">
        <div className="glass-panel max-w-lg w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold mb-2">Booking Submitted!</h2>
          <p className="text-gray-400 mb-8">Your slot request is pending approval.</p>

          <div className="glass-panel-soft p-5 text-left space-y-3 mb-8">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Resource</span>
              <span className="text-white font-semibold">{booking.resource?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Date</span>
              <span className="text-white font-semibold">{booking.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Time</span>
              <span className="text-white font-semibold">{booking.startTime} – {booking.endTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Purpose</span>
              <span className="text-white font-semibold text-right max-w-xs">{booking.purpose}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Status</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-500 text-black">
                {booking.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setSubmitted(false); setDate(''); setSelectedSession(''); setPurpose(''); }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 transition-colors"
            >
              Book Another
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-white text-black font-semibold py-3 hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Booking form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen app-shell text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link to="/resources" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Resources
          </Link>
          <h1 className="text-4xl font-bold mb-2">Book a Slot</h1>
          <p className="text-gray-400">Reserve a resource for your scheduled time.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Resource Selection ───────────────────────────────────────────── */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-white text-black text-xs font-bold rounded-full">1</span>
              Select Resource
            </h2>

            {/* Dropdown (only when not pre-selected via URL) */}
            {!resourceIdFromUrl && (
              <select
                value={selectedResourceId}
                onChange={e => setSelectedResourceId(e.target.value)}
                className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white mb-4"
              >
                <option value="">-- Choose a resource --</option>
                {resources.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.category}) — {r.location}
                  </option>
                ))}
              </select>
            )}

            {/* Resource detail card */}
            {resourceLoading && (
              <div className="flex items-center gap-3 text-gray-400 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span className="text-sm">Loading resource...</span>
              </div>
            )}

            {resource && !resourceLoading && (
              <div className="glass-panel-soft flex gap-4 p-4">
                <div className="w-16 h-16 bg-gray-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {resource.imageUrl
                    ? <img src={resource.imageUrl} alt={resource.name} className="w-full h-full object-cover" />
                    : <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-white font-bold text-lg">{resource.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold text-white ${CATEGORY_COLORS[resource.category] || 'bg-gray-600'}`}>
                      {resource.category}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold ${resource.availability ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                      {resource.availability ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{resource.location}</p>
                  <p className="text-gray-400 text-sm">Capacity: <span className="text-white">{resource.capacity} people</span></p>
                  {resource.features?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {resource.features.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-gray-600 text-gray-300 border border-gray-500">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!resource && !resourceLoading && selectedResourceId && (
              <p className="text-red-400 text-sm">Could not load resource details.</p>
            )}

            {!selectedResourceId && !resourceLoading && (
              <p className="text-gray-500 text-sm">No resource selected.</p>
            )}
          </div>

          {/* ── Date & Session ───────────────────────────────────────────────── */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-white text-black text-xs font-bold rounded-full">2</span>
              Date &amp; Session
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Booking Date</label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all"
                />
              </div>

              {/* Session Slot */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Choose Slot</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SESSION_SLOTS.map((slot) => (
                    <button
                      key={slot.key}
                      type="button"
                      onClick={() => setSelectedSession(slot.key)}
                      className={`px-4 py-3 text-sm font-semibold border transition-colors ${
                        selectedSession === slot.key
                          ? 'bg-white text-black border-white'
                          : 'glass-panel-soft text-white hover:bg-gray-600/70'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSession && (
                <div className="px-4 py-3 bg-indigo-600 text-white text-sm font-semibold text-center">
                  Selected: {SESSION_SLOTS.find((slot) => slot.key === selectedSession)?.label}
                </div>
              )}
            </div>
          </div>

          {/* ── Purpose ─────────────────────────────────────────────────────── */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-white text-black text-xs font-bold rounded-full">3</span>
              Purpose &amp; Approver
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Reason for Booking
                </label>
                <textarea
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  required
                  rows={4}
                  maxLength={500}
                  placeholder="Briefly describe why you need this resource…"
                  className="glass-input w-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all resize-none"
                />
                <p className="text-gray-500 text-xs mt-1 text-right">{purpose.length}/500</p>
              </div>

              {userType === 'student' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Staff to Approve This Booking
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    required
                    className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                  >
                    <option value="">-- Select staff --</option>
                    {staffList.map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} ({staff.email}{staff.department ? `, ${staff.department}` : ''})
                      </option>
                    ))}
                  </select>
                  <p className="text-gray-500 text-xs mt-1">
                    Only the selected staff member (and admins) will be able to review and act on this request.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Submit ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/resources"
              className="glass-panel-soft flex-1 text-center hover:bg-gray-600/70 text-white font-semibold py-4 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !selectedResourceId || !resource?.availability}
              className="flex-1 bg-white text-black font-semibold py-4 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Confirm Booking
                </>
              )}
            </button>
          </div>

          {resource && !resource.availability && (
            <p className="text-red-400 text-sm text-center">
              This resource is currently marked unavailable and cannot be booked.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default BookSlot
