import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './pages.css'

function Bookings() {

  const [bookings, setBookings] = useState([])
  const [ownerRequests, setOwnerRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {

    if (user) {
      fetchBookings()
      fetchOwnerRequests()
    } else {
      setLoading(false)
    }

  }, [])

  // Fetch bookings made by the logged-in farmer
  const fetchBookings = async () => {

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

    } finally {

      setLoading(false)

    }
  }

  // Fetch requests for equipment owned by the logged-in farmer
  const fetchOwnerRequests = async () => {

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

  // Approve or reject booking
  const updateBookingStatus = async (bookingId, status) => {

    try {

      const response = await fetch(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: status
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Failed to update booking')
        return
      }

      alert(`Booking ${status.toLowerCase()} successfully!`)

      // Refresh both lists
      fetchBookings()
      fetchOwnerRequests()

    } catch (error) {

      console.error('Status update error:', error)
      alert('Unable to update booking status')

    }
  }

  return (
    <div>

      <header className="navbar">

        <Link to="/" className="logo">
          🌾 AgroShare
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/equipment">Equipment</Link>
          <Link to="/bookings">Bookings</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>

      </header>

      <section className="page-header">

        <h1>My Bookings</h1>

        <p>
          Track your bookings and manage equipment requests.
        </p>

      </section>


      {/* Farmer's bookings */}

      <section className="bookings-page">

        <h2>📅 My Bookings</h2>

        {loading && (
          <p>Loading bookings...</p>
        )}

        {!loading && bookings.length === 0 && (
          <p>No bookings made yet.</p>
        )}

        {bookings.map((booking) => (

          <div
            className="booking-card"
            key={booking._id}
          >

            <div>

              <h3>{booking.equipmentName}</h3>

              <p>
                📍 {booking.location}
              </p>

              <p>
                📅 {booking.date}
              </p>

              <p>
                💰 ₹{booking.pricePerDay} / day
              </p>

              <p>
                👨‍🌾 Owner: {booking.owner}
              </p>

            </div>

            <span
              className={
                booking.status === 'Approved'
                  ? 'status approved'
                  : booking.status === 'Rejected'
                    ? 'status rejected'
                    : 'status pending'
              }
            >
              {booking.status}
            </span>

          </div>

        ))}

      </section>


      {/* Owner booking requests */}

      <section className="bookings-page">

        <h2>🔔 Equipment Booking Requests</h2>

        {ownerRequests.length === 0 && (
          <p>No booking requests for your equipment.</p>
        )}

        {ownerRequests.map((booking) => (

          <div
            className="booking-card"
            key={booking._id}
          >

            <div>

              <h3>{booking.equipmentName}</h3>

              <p>
                👨‍🌾 Requested by: {booking.farmerName}
              </p>

              <p>
                📍 {booking.location}
              </p>

              <p>
                📅 {booking.date}
              </p>

              <p>
                💰 ₹{booking.pricePerDay} / day
              </p>

              <p>
                Status: <strong>{booking.status}</strong>
              </p>

            </div>

            {booking.status === 'Pending' && (

              <div>

                <button
                  className="book-button"
                  onClick={() =>
                    updateBookingStatus(
                      booking._id,
                      'Approved'
                    )
                  }
                >
                  Accept
                </button>

                <button
                  className="book-button"
                  onClick={() =>
                    updateBookingStatus(
                      booking._id,
                      'Rejected'
                    )
                  }
                >
                  Reject
                </button>

              </div>

            )}

          </div>

        ))}

      </section>

    </div>
  )
}

export default Bookings