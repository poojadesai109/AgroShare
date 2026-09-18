import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './pages.css'

function Dashboard() {

  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user'))
  const [equipmentCount, setEquipmentCount] = useState(0)
  const [bookingCount, setBookingCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [earnings, setEarnings] = useState(0)

  useEffect(() => {

    if (user) {

      // Get equipment count
      fetch(
        `http://localhost:5000/api/equipment/count/${encodeURIComponent(user.name)}`
      )
        .then(response => response.json())
        .then(data => {
          setEquipmentCount(data.count)
        })
        .catch(error => {
          console.error('Error fetching equipment count:', error)
        })

      // Get booking count
      fetch(
        `http://localhost:5000/api/bookings/count/${user.id}`
      )
        .then(response => response.json())
        .then(data => {
          setBookingCount(data.count)
        })
        .catch(error => {
          console.error('Error fetching booking count:', error)
        })
      // Get pending booking requests
      fetch(
        `http://localhost:5000/api/bookings/pending-count/${encodeURIComponent(user.name)}`
      )
        .then(response => response.json())
        .then(data => {
          setPendingCount(data.count)
        })
        .catch(error => {
          console.error('Error fetching pending requests:', error)
        })
      // Get equipment earnings
      fetch(
        `http://localhost:5000/api/bookings/earnings/${encodeURIComponent(user.name)}`
      )
        .then(response => response.json())
        .then(data => {
          setEarnings(data.totalEarnings)
        })
        .catch(error => {
          console.error('Error fetching earnings:', error)
        })

    }

  }, [])
  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
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

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>

      </header>

      <section className="page-header">

        <h1>
          Welcome, {user ? user.name : 'Farmer'} 👋
        </h1>

        <p>
          Manage your equipment, bookings and farming activities.
        </p>

      </section>

      <section className="dashboard">

        <div className="dashboard-card">
          <span>🚜</span>
          <h3>My Equipment</h3>
          <strong>{equipmentCount}</strong>
          <p>Equipment Listed</p>
        </div>

        <div className="dashboard-card">
          <span>📅</span>
          <h3>My Bookings</h3>
          <strong>{bookingCount}</strong>
          <p>Total Bookings</p>
        </div>

        <div className="dashboard-card">
          <span>⏳</span>
          <h3>Pending Requests</h3>
          <strong>{pendingCount}</strong>
          <p>Waiting for approval</p>
        </div>

        <div className="dashboard-card">
          <span>💰</span>
          <h3>Equipment Earnings</h3>
          <strong>₹{earnings}</strong>
          <p>Total Earnings</p>
        </div>

      </section>

      <section className="decision-section">

        <h2>🌱 Decision Support</h2>

        <p>
          Get recommendations based on your farming requirements,
          equipment availability and estimated costs.
        </p>

        <button className="primary-btn">
          Get Recommendation
        </button>

      </section>

    </div>
  )
}

export default Dashboard