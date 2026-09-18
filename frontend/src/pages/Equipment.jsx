import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './pages.css'

function Equipment() {

  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {

    try {

      const response = await fetch('http://localhost:5000/api/equipment')

      if (!response.ok) {
        throw new Error('Failed to fetch equipment')
      }

      const data = await response.json()

      setEquipment(data)

    } catch (error) {

      console.error('Equipment fetch error:', error)
      setError('Unable to load equipment')

    } finally {

      setLoading(false)

    }
  }
  const handleBooking = async (item) => {

    const user = JSON.parse(localStorage.getItem('user'))

    if (!user) {
      alert('Please login before booking equipment.')
      navigate('/login')
      return
    }

    const date = prompt(
      `Enter booking date for ${item.name} (Example: 15 September 2026)`
    )

    if (!date) {
      return
    }

    try {

      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          equipmentId: item._id,
          equipmentName: item.name,
          farmerId: user.id,
          farmerName: user.name,
          owner: item.owner,
          location: item.location,
          date: date,
          pricePerDay: item.pricePerDay
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Booking failed')
        return
      }

      alert('Booking request sent successfully!')

      navigate('/bookings')

    } catch (error) {

      console.error('Booking error:', error)
      alert('Unable to send booking request')

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

        <div className="nav-buttons">
          <Link to="/login" className="login-btn">
            Login
          </Link>

          <Link to="/register" className="register-btn">
            Register
          </Link>
        </div>

      </header>

      <section className="page-header">

        <h1>Available Agricultural Equipment</h1>

        <p>
          Find and book equipment from nearby farmers.
        </p>

      </section>

      <section className="equipment-page">

        <div className="search-area">

          <input
            type="text"
            placeholder="Search equipment..."
          />

          <select>
            <option>All Equipment</option>
            <option>Tractor</option>
            <option>Harvester</option>
            <option>Tillage Equipment</option>
            <option>Irrigation</option>
          </select>

          <button>
            Search
          </button>

        </div>

        {loading && (
          <p>Loading equipment...</p>
        )}

        {error && (
          <p>{error}</p>
        )}

        {!loading && !error && equipment.length === 0 && (
          <p>No equipment available yet.</p>
        )}

        <div className="equipment-grid">

          {equipment.map((item) => (

            <div className="equipment-item" key={item._id}>

              <div className="equipment-item-icon">
                🚜
              </div>

              <h3>{item.name}</h3>

              <p>
                <strong>Type:</strong> {item.type}
              </p>

              <p>
                <strong>Location:</strong> {item.location}
              </p>

              <p>
                <strong>Owner:</strong> {item.owner}
              </p>

              <div className="price">
                ₹{item.pricePerDay} / day
              </div>

              <button
                className="book-button"
                onClick={() => handleBooking(item)}
              >
                Book Equipment
              </button>

            </div>

          ))}

        </div>

      </section>

    </div>
  )
}

export default Equipment