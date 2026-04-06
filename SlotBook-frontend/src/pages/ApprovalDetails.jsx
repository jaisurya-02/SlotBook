import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'
import axiosInstance from '../api/axios'

const statusColorMap = {
  pending: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
  pending_staff: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
  pending_admin: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
  approved: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
  rejected: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
}

const DetailRow = ({ label, value, mono = false }) => (
  <div className="rounded-none border border-white/10 bg-black/20 px-4 py-3">
    <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">{label}</p>
    <p className={`mt-1 text-sm text-gray-100 ${mono ? 'font-mono break-all' : ''}`}>{value || 'N/A'}</p>
  </div>
)

const DetailSection = ({ title, subtitle, children }) => (
  <section className="rounded-none border border-white/10 bg-[#14181f]/90 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
    <header className="border-b border-white/10 px-6 py-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </header>
    <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">{children}</div>
  </section>
)

const ApprovalDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to continue')
      navigate('/login')
      return
    }

    try {
      const decoded = jwtDecode(token)
      const role = decoded.role || decoded.userType || 'user'
      if (role !== 'admin') {
        toast.error('Only admins can view booking approval details')
        navigate('/approvals')
        return
      }
    } catch (error) {
      console.error('Token decode failed:', error)
      toast.error('Invalid session. Please login again.')
      localStorage.removeItem('token')
      navigate('/login')
      return
    }

    const fetchBooking = async () => {
      setLoading(true)
      try {
        const res = await axiosInstance.get(`/bookings/${id}`)
        setBooking(res.data.booking || null)
      } catch (error) {
        console.error('Error loading booking details:', error)
        toast.error(error.response?.data?.error || 'Failed to load booking details')
        navigate('/approvals')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [id, navigate])

  const formatDateTime = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1f2937_0,#0a0d12_45%,#030507_100%)] text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto rounded-none border border-white/10 bg-[#14181f]/90 p-8">
          <p className="text-gray-300">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1f2937_0,#0a0d12_45%,#030507_100%)] text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto rounded-none border border-white/10 bg-[#14181f]/90 p-8">
          <p className="text-gray-300 mb-4">Booking details are unavailable.</p>
          <button
            onClick={() => navigate('/approvals')}
            className="rounded-none border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Back to Approvals
          </button>
        </div>
      </div>
    )
  }

  const isApproved = booking.status === 'approved'
  const statusClass = statusColorMap[booking.status] || 'bg-slate-500/20 text-slate-200 border-slate-400/40'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1f2937_0,#0a0d12_45%,#030507_100%)] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="rounded-none border border-white/10 bg-[#14181f]/90 px-6 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300">Admin Review</p>
              <h1 className="mt-2 text-3xl font-semibold">Booking Details</h1>
              <p className="mt-2 text-sm text-gray-300">A complete audit-ready view of request, resource, requester, and approval workflow.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-none border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass}`}>
                {booking.status || 'unknown'}
              </span>
              <button
                onClick={() => navigate('/approvals')}
                className="rounded-none border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Back to Approvals
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DetailRow label="Booking ID" value={booking._id} mono />
            <DetailRow label="Created At" value={formatDateTime(booking.createdAt)} />
            <DetailRow label="Schedule" value={`${booking.date || 'N/A'} | ${booking.startTime || 'N/A'} - ${booking.endTime || 'N/A'}`} />
          </div>
        </div>

        {!isApproved && (
          <div className="rounded-none border border-yellow-400/40 bg-yellow-500/15 px-4 py-3 text-sm text-yellow-100">
            This booking is not approved yet. Approval-specific fields may be empty.
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DetailSection title="Booking" subtitle="Core request information and slot timing.">
            <DetailRow label="Status" value={(booking.status || 'N/A').toUpperCase()} />
            <DetailRow label="Date" value={booking.date || 'N/A'} />
            <DetailRow label="Time" value={`${booking.startTime || 'N/A'} - ${booking.endTime || 'N/A'}`} />
            <DetailRow label="Purpose" value={booking.purpose || 'N/A'} />
          </DetailSection>

          <DetailSection title="Booked By" subtitle="Identity details of the requester.">
            <DetailRow label="Name" value={booking.userName || 'N/A'} />
            <DetailRow label="Email" value={booking.userEmail || 'N/A'} />
            <DetailRow label="User ID" value={booking.userId || 'N/A'} mono />
          </DetailSection>

          <DetailSection title="Resource" subtitle="The asset selected for this booking.">
            <DetailRow label="Resource Name" value={booking.resource?.name || 'N/A'} />
            <DetailRow label="Category" value={booking.resource?.category || 'N/A'} />
            <DetailRow label="Location" value={booking.resource?.location || 'N/A'} />
            <DetailRow label="Resource ID" value={booking.resource?._id || 'N/A'} mono />
          </DetailSection>

          <DetailSection title="Workflow" subtitle="Assignment and approval audit trail.">
            <DetailRow label="Assigned Staff" value={booking.assignedStaffName || booking.assignedStaffEmail || 'N/A'} />
            <DetailRow label="Assigned Staff ID" value={booking.assignedStaffId || 'N/A'} mono />
            <DetailRow label="Last Action By" value={booking.statusUpdatedByName || booking.statusUpdatedByEmail || 'N/A'} />
            <DetailRow label="Last Action At" value={formatDateTime(booking.statusUpdatedAt)} />
            <DetailRow label="Accepted By" value={booking.approvedByName || booking.approvedByEmail || 'N/A'} />
            <DetailRow label="Accepted At" value={formatDateTime(booking.approvedAt)} />
          </DetailSection>
        </div>
      </div>
    </div>
  )
}

export default ApprovalDetails
