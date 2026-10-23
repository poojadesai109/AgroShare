import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './pages.css'

function Equipment() {
  const [equipment, setEquipment] = useState([])
  const [filteredEquipment, setFilteredEquipment] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState('All Equipment')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // States for the in-page booking date picker
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [bookingLoading, setBookingLoading] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      const response = await fetch(
        'http://localhost:5000/api/equipment'
      )

      if (!response.ok) {
        throw new Error('Failed to fetch equipment')
      }

      const data = await response.json()
      setEquipment(data)
      setFilteredEquipment(data)
    } catch (error) {
      console.error('Equipment fetch error:', error)
      setError('Unable to load equipment')
    } finally {
      setLoading(false)
    }
  }

  // Open the equipment's saved location in Google Maps
  const openEquipmentLocation = (location) => {
    const place = String(location || '').trim()

    if (!place) {
      alert('The owner has not provided an equipment location.')
      return
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleSearch = () => {
    const search = searchText.toLowerCase().trim()

    const results = equipment.filter((item) => {
      const matchesSearch =
        (item.name || '').toLowerCase().includes(search) ||
        (item.type || '').toLowerCase().includes(search) ||
        (item.location || '').toLowerCase().includes(search) ||
        (item.owner || '').toLowerCase().includes(search)

      const matchesType =
        selectedType === 'All Equipment' ||
        (item.type || '').toLowerCase() === selectedType.toLowerCase()

      return matchesSearch && matchesType
    })

    setFilteredEquipment(results)
  }

  // Open the date picker after checking login
  const openBooking = (item) => {
    const user = JSON.parse(localStorage.getItem('user'))

    if (!user) {
      alert('Please login before booking equipment.')
      navigate('/login')
      return
    }

    setSelectedEquipment(item)
    setSelectedDate(null)
  }

  const closeBooking = () => {
    if (bookingLoading) return

    setSelectedEquipment(null)
    setSelectedDate(null)
  }

  const handleBooking = async () => {
    const user = JSON.parse(localStorage.getItem('user'))

    if (!user) {
      alert('Please login before booking equipment.')
      navigate('/login')
      return
    }

    if (!selectedEquipment || !selectedDate) {
      alert('Please select a booking date.')
      return
    }

    const date = selectedDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    try {
      setBookingLoading(true)

      const response = await fetch(
        'http://localhost:5000/api/bookings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            equipmentId: selectedEquipment._id,
            equipmentName: selectedEquipment.name,
            farmerId: user.id,
            farmerName: user.name,
            owner: selectedEquipment.owner,
            location: selectedEquipment.location,
            date: date,
            pricePerDay: selectedEquipment.pricePerDay
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Booking failed')
        return
      }

      alert('Booking request sent successfully!')
      setSelectedEquipment(null)
      setSelectedDate(null)
      navigate('/bookings')
    } catch (error) {
      console.error('Booking error:', error)
      alert('Unable to send booking request')
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div>
      <Navbar />

      <section className="page-header">
        <h1>Available Agricultural Equipment</h1>
        <p>Find and book equipment from nearby farmers.</p>
      </section>

      <section className="equipment-page">
        <div className="search-area">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option>All Equipment</option>
            <option>Tractor</option>
            <option>Harvester</option>
            <option>Rotavator</option>
            <option>Tillage Equipment</option>
            <option>Irrigation Equipment</option>
            <option>Other</option>
          </select>

          <button onClick={handleSearch}>
            Search
          </button>
        </div>

        {loading && <p>Loading equipment...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && filteredEquipment.length === 0 && (
          <p>No matching equipment found.</p>
        )}

        <div className="equipment-grid">
          {filteredEquipment.map((item) => (
            <div className="equipment-item" key={item._id}>
              <div className="equipment-item-icon">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'contain',
                      borderRadius: '10px'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '70px' }}>
                    {item.type === 'Tractor'
                      ? '🚜'
                      : item.type === 'Harvester'
                        ? '🌾'
                        : item.type === 'Rotavator'
                          ? '⚙️'
                          : item.type === 'Irrigation Equipment'
                            ? '💧'
                            : item.type === 'Tillage Equipment'
                              ? '🌱'
                              : '🚜'}
                  </span>
                )}
              </div>

              <h3>{item.name}</h3>

              <p>
                <strong>Type:</strong> {item.type}
              </p>

              <p>
                <strong>Location:</strong> {item.location}
              </p>

              {/* NEW: View equipment location in Google Maps */}
              <button
                type="button"
                onClick={() => openEquipmentLocation(item.location)}
                className="card-btn"
              >
                📍 View Location in Google Maps
              </button>

              <p>
                <strong>Owner:</strong> {item.owner}
              </p>

              <div className="price">
                ₹{item.pricePerDay} / day
              </div>

              <button
                className="book-button"
                onClick={() => openBooking(item)}
              >
                Book Equipment
              </button>

              <Link
                to={`/equipment/${item._id}`}
                className="card-btn"
              >
                View Equipment
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* In-page booking date picker */}
      {selectedEquipment && (
        <div
          className="booking-modal-overlay"
          onClick={closeBooking}
        >
          <section
            className="booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="booking-modal-close"
              onClick={closeBooking}
              disabled={bookingLoading}
              aria-label="Close booking dialog"
            >
              ×
            </button>

            <h2 id="booking-modal-title">Book Equipment</h2>

            <p className="booking-modal-equipment">
              {selectedEquipment.name}
            </p>

            <p className="booking-modal-price">
              ₹{selectedEquipment.pricePerDay} / day
            </p>

            <label className="booking-modal-label">
              Select Booking Date
            </label>

            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              placeholderText="Choose a booking date"
              dateFormat="dd MMMM yyyy"
              className="equipment-booking-date-picker"
              calendarClassName="agroshare-calendar"
              popperPlacement="bottom-start"
              showPopperArrow={false}
              disabled={bookingLoading}
              required
            />

            <p className="booking-modal-note">
              Select your preferred date to send a booking request to the equipment owner.
            </p>

            <div className="booking-modal-actions">
              <button
                type="button"
                className="booking-cancel-btn"
                onClick={closeBooking}
                disabled={bookingLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="booking-confirm-btn"
                onClick={handleBooking}
                disabled={!selectedDate || bookingLoading}
              >
                {bookingLoading ? 'Sending...' : 'Confirm Booking'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default Equipment
