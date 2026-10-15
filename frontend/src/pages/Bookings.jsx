
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './pages.css'

function Bookings() {
  const [bookings, setBookings] = useState([])
  const [ownerRequests, setOwnerRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const navigate = useNavigate()

  const fetchBookings = async () => {
    if (!user) return

    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/${user.id}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Booking fetch error:', error)
    }
  }

  const fetchOwnerRequests = async () => {
    if (!user) return

    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/owner/${encodeURIComponent(user.name)}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch owner requests')
      }

      const data = await response.json()
      setOwnerRequests(data)
    } catch (error) {
      console.error('Owner requests error:', error)
    }
  }

  const refreshBookings = async () => {
    setLoading(true)

    try {
      await Promise.all([
        fetchBookings(),
        fetchOwnerRequests()
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      refreshBookings()
    } else {
      setLoading(false)
    }
  }, [])

  const handlePayNow = (booking) => {
    navigate(`/payment/${booking._id}`, {
      state: { booking }
    })
  }

  const updateBookingStatus = async (bookingId, status) => {
    try {
      setUpdatingId(bookingId)

      const response = await fetch(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Failed to update booking')
        return
      }

      alert(`Booking ${status.toLowerCase()} successfully!`)
      await refreshBookings()
    } catch (error) {
      console.error('Status update error:', error)
      alert('Unable to update booking status')
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusClass = (status) => {
    const value = (status || 'Pending').toLowerCase()
    return `booking-status booking-status-${value}`
  }

  const totalApproved = bookings.filter(
    (booking) => booking.status === 'Approved'
  ).length

  const totalPending = bookings.filter(
    (booking) => booking.status === 'Pending'
  ).length

  const totalRejected = bookings.filter(
    (booking) => booking.status === 'Rejected'
  ).length

  const totalPaid = bookings.filter(
    (booking) => booking.paymentStatus === 'Paid'
  ).length

  return (
    <div className="bookings-page-wrapper">
      <Navbar />

      <header className="bookings-hero">
        <div className="bookings-hero-content">
          <span className="bookings-eyebrow">
            AGROSHARE • FARMER PORTAL
          </span>

          <h1>My Bookings</h1>

          <p>
            Track your equipment bookings, payments, and requests from
            other farmers.
          </p>
        </div>
      </header>

      <main className="bookings-main">
        {!user ? (
          <section className="bookings-empty">
            <div className="bookings-empty-icon">🔐</div>
            <h2>Login to view your bookings</h2>
            <p>
              Sign in to manage your equipment bookings and requests.
            </p>

            <button
              className="bookings-primary-btn"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          </section>
        ) : (
          <>
            <section className="booking-summary-grid">
              <div className="booking-summary-card">
                <span className="booking-summary-icon">📋</span>
                <div>
                  <p>Total Bookings</p>
                  <h3>{bookings.length}</h3>
                </div>
              </div>

              <div className="booking-summary-card">
                <span className="booking-summary-icon summary-green">
                  ✓
                </span>
                <div>
                  <p>Approved</p>
                  <h3>{totalApproved}</h3>
                </div>
              </div>

              <div className="booking-summary-card">
                <span className="booking-summary-icon summary-amber">
                  ◷
                </span>
                <div>
                  <p>Pending</p>
                  <h3>{totalPending}</h3>
                </div>
              </div>

              <div className="booking-summary-card">
                <span className="booking-summary-icon summary-red">
                  ×
                </span>
                <div>
                  <p>Rejected</p>
                  <h3>{totalRejected}</h3>
                </div>
              </div>
            </section>

            {/* MY BOOKINGS */}

            <section className="bookings-section">
              <div className="bookings-section-heading">
                <div>
                  <span className="bookings-section-kicker">
                    YOUR ACTIVITY
                  </span>

                  <h2>My Bookings</h2>

                  <p>
                    Equipment you have requested from other farmers.
                  </p>
                </div>

                <span className="booking-count">
                  {bookings.length}{' '}
                  {bookings.length === 1 ? 'booking' : 'bookings'}
                </span>
              </div>

              {loading ? (
                <div className="bookings-message">
                  <span className="bookings-loader" />
                  <p>Loading your bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="bookings-empty">
                  <div className="bookings-empty-icon">🚜</div>
                  <h3>No bookings yet</h3>
                  <p>
                    Explore available equipment and make your first booking.
                  </p>

                  <button
                    className="bookings-primary-btn"
                    onClick={() => navigate('/equipment')}
                  >
                    Explore Equipment
                  </button>
                </div>
              ) : (
                <div className="bookings-card-list">
                  {bookings.map((booking) => (
                    <article
                      className="booking-modern-card"
                      key={booking._id}
                    >
                      <div className="booking-card-main">
                        <div className="booking-equipment-icon">
                          🚜
                        </div>

                        <div className="booking-equipment-info">
                          <div className="booking-title-row">
                            <h3>{booking.equipmentName}</h3>

                            <span
                              className={getStatusClass(booking.status)}
                            >
                              {booking.status || 'Pending'}
                            </span>
                          </div>

                          <div className="booking-detail-grid">
                            <p>
                              <span>📍</span>{' '}
                              {booking.location || 'Location unavailable'}
                            </p>

                            <p>
                              <span>📅</span>{' '}
                              {booking.date
                                ? booking.date.replace(
                                    'Septamber',
                                    'September'
                                  )
                                : 'Date unavailable'}
                            </p>

                            <p>
                              <span>👨‍🌾</span> Owner:{' '}
                              {booking.owner || 'Not specified'}
                            </p>

                            <p>
                              <span>💰</span> ₹{booking.pricePerDay} / day
                            </p>
                          </div>

                          {/* PAYMENT STATUS */}

                          {booking.status === 'Approved' && (
                            <div className="booking-payment-info">
                              <span className="booking-payment-label">
                                Payment:
                              </span>

                              <span
                                className={
                                  booking.paymentStatus === 'Paid'
                                    ? 'booking-status booking-status-paid'
                                    : 'booking-status booking-status-pending'
                                }
                              >
                                {booking.paymentStatus || 'Pending'}
                              </span>
                            </div>
                          )}

                          {/* SHOW PAYMENT DETAILS ONLY WHEN PAID */}

                          {booking.paymentStatus === 'Paid' && (
                            <div className="booking-transaction">
                              {booking.paymentMethod && (
                                <p>
                                  Payment method: {booking.paymentMethod}
                                </p>
                              )}

                              {booking.transactionId && (
                                <p>
                                  Transaction ID:{' '}
                                  <strong>
                                    {booking.transactionId}
                                  </strong>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="booking-card-actions">
                        {booking.status === 'Approved' &&
                          booking.paymentStatus !== 'Paid' && (
                            <button
                              className="bookings-primary-btn"
                              onClick={() => handlePayNow(booking)}
                            >
                              💳 Pay Now
                            </button>
                          )}

                        {booking.paymentStatus === 'Paid' && (
                          <span className="booking-paid-label">
                            ✓ Payment completed
                          </span>
                        )}

                        {booking.status === 'Rejected' && (
                          <span className="booking-action-note">
                            This request was declined.
                          </span>
                        )}

                        {booking.status === 'Pending' && (
                          <span className="booking-action-note">
                            Waiting for owner approval
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* EQUIPMENT BOOKING REQUESTS */}

            <section className="bookings-section">
              <div className="bookings-section-heading">
                <div>
                  <span className="bookings-section-kicker">
                    OWNER ACTIVITY
                  </span>

                  <h2>Equipment Booking Requests</h2>

                  <p>
                    Requests from farmers who want to rent your equipment.
                  </p>
                </div>

                <span className="booking-count">
                  {ownerRequests.length}{' '}
                  {ownerRequests.length === 1 ? 'request' : 'requests'}
                </span>
              </div>

              {loading ? (
                <div className="bookings-message">
                  <span className="bookings-loader" />
                  <p>Loading requests...</p>
                </div>
              ) : ownerRequests.length === 0 ? (
                <div className="bookings-empty">
                  <div className="bookings-empty-icon">🔔</div>
                  <h3>No booking requests yet</h3>
                  <p>
                    Requests for your listed equipment will appear here.
                  </p>
                </div>
              ) : (
                <div className="bookings-card-list">
                  {ownerRequests.map((booking) => (
                    <article
                      className="booking-modern-card"
                      key={booking._id}
                    >
                      <div className="booking-card-main">
                        <div className="booking-equipment-icon">
                          🌾
                        </div>

                        <div className="booking-equipment-info">
                          <div className="booking-title-row">
                            <h3>{booking.equipmentName}</h3>

                            <span
                              className={getStatusClass(booking.status)}
                            >
                              {booking.status || 'Pending'}
                            </span>
                          </div>

                          <div className="booking-detail-grid">
                            <p>
                              <span>👨‍🌾</span> Requested by:{' '}
                              {booking.farmerName}
                            </p>

                            <p>
                              <span>📍</span>{' '}
                              {booking.location || 'Location unavailable'}
                            </p>

                            <p>
                              <span>📅</span>{' '}
                              {booking.date
                                ? booking.date.replace(
                                    'Septamber',
                                    'September'
                                  )
                                : 'Date unavailable'}
                            </p>

                            <p>
                              <span>💰</span> ₹{booking.pricePerDay} / day
                            </p>
                          </div>

                          {booking.paymentStatus === 'Paid' && (
                            <div className="booking-payment-info">
                              <span className="booking-payment-label">
                                Payment received:
                              </span>

                              <span className="booking-status booking-status-paid">
                                Paid
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {booking.status === 'Pending' && (
                        <div className="booking-request-actions">
                          <button
                            className="booking-accept-btn"
                            disabled={updatingId === booking._id}
                            onClick={() =>
                              updateBookingStatus(
                                booking._id,
                                'Approved'
                              )
                            }
                          >
                            {updatingId === booking._id
                              ? 'Updating...'
                              : '✓ Accept'}
                          </button>

                          <button
                            className="booking-reject-btn"
                            disabled={updatingId === booking._id}
                            onClick={() =>
                              updateBookingStatus(
                                booking._id,
                                'Rejected'
                              )
                            }
                          >
                            {updatingId === booking._id
                              ? 'Updating...'
                              : '✕ Reject'}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="bookings-payment-footnote">
              <span>🔒</span>

              <p>
                Payment details and transaction information are shown when
                available.
              </p>

              <span className="booking-paid-count">
                {totalPaid} paid{' '}
                {totalPaid === 1 ? 'booking' : 'bookings'}
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Bookings
