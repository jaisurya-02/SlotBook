import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import axiosInstance from '../api/axios'

const SESSION_SLOTS = [
  { key: 'FN', label: 'FN', startTime: '09:00', endTime: '13:00' },
  { key: 'AN', label: 'AN', startTime: '13:00', endTime: '17:00' },
  { key: 'EVENING', label: 'Evening', startTime: '17:00', endTime: '21:00' },
]

const isSlotUnavailable = (slotStart, slotEnd, bookings) => {
  return bookings.some((b) => slotStart < b.endTime && slotEnd > b.startTime)
}

const getBookedSlotsForDay = (bookings) => {
  return SESSION_SLOTS.filter((slot) => isSlotUnavailable(slot.startTime, slot.endTime, bookings))
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getMonthRange = (monthDate) => {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  return { start, end }
}

const getCalendarDays = (monthDate) => {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())

  const days = []
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

const ResourceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resource, setResource] = useState(null)
  const [bookedDurationsByDate, setBookedDurationsByDate] = useState({})
  const [loading, setLoading] = useState(true)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))

  const monthLabel = useMemo(
    () => currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [currentMonth]
  )

  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth])

  const selectedDateBookings = useMemo(
    () => bookedDurationsByDate[selectedDate] || [],
    [bookedDurationsByDate, selectedDate]
  )

  const fetchResource = async () => {
    try {
      const res = await axiosInstance.get(`/resources/${id}`)
      setResource(res.data.resource)
    } catch (error) {
      console.error('Failed to load resource details:', error)
      toast.error(error.response?.data?.error || 'Failed to load resource details')
      navigate('/resources')
    }
  }

  const fetchMonthAvailability = async (monthDate) => {
    setCalendarLoading(true)
    try {
      const { start, end } = getMonthRange(monthDate)
      const res = await axiosInstance.get(`/resources/${id}/availability`, {
        params: {
          startDate: toDateKey(start),
          endDate: toDateKey(end),
        },
      })
      setBookedDurationsByDate(res.data.bookedDurationsByDate || {})
    } catch (error) {
      console.error('Failed to load resource availability:', error)
      toast.error(error.response?.data?.error || 'Failed to load availability')
      setBookedDurationsByDate({})
    } finally {
      setCalendarLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchResource()
      await fetchMonthAvailability(currentMonth)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!loading) {
      fetchMonthAvailability(currentMonth)
    }
  }, [currentMonth])

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    setCurrentMonth(first)
    setSelectedDate(toDateKey(now))
  }

  if (loading) {
    return (
      <div className="min-h-screen app-shell text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          <p className="text-gray-300 text-sm">Loading resource details...</p>
        </div>
      </div>
    )
  }

  if (!resource) {
    return null
  }

  return (
    <div className="min-h-screen app-shell text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to="/resources" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Resources
          </Link>
          <h1 className="text-4xl font-bold mb-2">{resource.name}</h1>
          <p className="text-gray-400">View resource details and day-wise time availability.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-panel p-6">
            <h2 className="text-2xl font-bold mb-4">Resource Details</h2>
            <div className="space-y-3 text-gray-300">
              <p><span className="text-gray-400">Category:</span> {resource.category}</p>
              <p><span className="text-gray-400">Location:</span> {resource.location}</p>
              <p><span className="text-gray-400">Capacity:</span> {resource.capacity} people</p>
              <p>
                <span className="text-gray-400">Status:</span>{' '}
                <span className={`px-2 py-0.5 text-xs font-semibold ${resource.availability ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {resource.availability ? 'AVAILABLE' : 'UNAVAILABLE'}
                </span>
              </p>
              <p className="text-gray-300"><span className="text-gray-400">Description:</span> {resource.description}</p>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-2xl font-bold mb-4">Quick Action</h2>
            <Link
              to={`/bookslot?resource=${resource._id}`}
              className="block w-full text-center bg-white text-black font-semibold py-3 hover:bg-gray-200 transition-colors"
            >
              Book This Resource
            </Link>
          </div>
        </div>

        <div className="glass-panel p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-bold">Availability Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToCurrentMonth}
                className="glass-panel-soft px-3 py-1.5 text-xs font-semibold hover:bg-gray-600/70"
              >
                Today
              </button>
              <button
                onClick={goToPreviousMonth}
                className="glass-panel-soft w-9 h-9 hover:bg-gray-600/70 text-white font-bold"
                aria-label="Previous month"
              >
                {'<'}
              </button>
              <div className="glass-panel-soft px-4 py-2 min-w-44 text-center text-sm font-semibold">
                {monthLabel}
              </div>
              <button
                onClick={goToNextMonth}
                className="glass-panel-soft w-9 h-9 hover:bg-gray-600/70 text-white font-bold"
                aria-label="Next month"
              >
                {'>'}
              </button>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-7 border border-gray-700">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="bg-gray-900 border-b border-gray-700 px-2 py-2 text-center text-xs font-semibold text-gray-300">
                {day}
              </div>
            ))}

            {calendarDays.map((day) => {
              const dayKey = toDateKey(day)
              const dayBookings = bookedDurationsByDate[dayKey] || []
              const bookedSlots = getBookedSlotsForDay(dayBookings)
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isSelected = dayKey === selectedDate

              return (
                <button
                  key={dayKey}
                  onClick={() => setSelectedDate(dayKey)}
                  className={`min-h-28 border-r border-b border-gray-700 px-2 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-gray-700'
                      : isCurrentMonth
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-900 text-gray-500 hover:bg-gray-800'
                  }`}
                >
                  <div className="text-xs font-semibold mb-2">{day.getDate()}</div>
                  <div className="space-y-1">
                    {bookedSlots.map((slot) => (
                      <div
                        key={`${dayKey}-${slot.key}`}
                        className="text-[10px] leading-tight px-1.5 py-1 font-semibold bg-red-600 text-white"
                      >
                        {slot.label}
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          {calendarLoading ? (
            <div className="flex items-center gap-3 text-gray-400 py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span className="text-sm">Loading monthly availability...</span>
            </div>
          ) : (
            <>
              {selectedDateBookings.length > 0 ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">Booked durations on {selectedDate}:</p>
                  <div className="space-y-2">
                    {selectedDateBookings.map((b) => (
                      <div key={b._id} className="glass-panel-soft p-3 flex flex-wrap items-center gap-3">
                        <span className="text-white font-semibold">{b.startTime} - {b.endTime}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-red-500 text-white">UNAVAILABLE</span>
                        <span className="text-xs text-gray-300">Booked by {b.userName || b.userEmail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-green-400 mb-4">No bookings on {selectedDate}. All listed slots are available.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SESSION_SLOTS.map((slot) => {
                  const unavailable = isSlotUnavailable(slot.startTime, slot.endTime, selectedDateBookings)
                  return (
                    <div
                      key={slot.key}
                      className={`p-2 text-xs font-semibold border text-center ${
                        unavailable
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-green-700 border-green-600 text-white'
                      }`}
                    >
                      {slot.label} ({slot.startTime} - {slot.endTime})
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResourceDetails
