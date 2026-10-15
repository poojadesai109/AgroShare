import Navbar from '../components/Navbar'
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

  const [myEquipment, setMyEquipment] = useState([])

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


      // Get all equipment and show only owner's equipment
      fetch('http://localhost:5000/api/equipment')
        .then(response => response.json())
        .then(data => {

          const ownerEquipment = data.filter(
            item => item.owner === user.name
          )

          setMyEquipment(ownerEquipment)

        })
        .catch(error => {
          console.error('Error fetching equipment:', error)
        })
    }

  }, [])


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }


  // ==========================================
  // DELETE EQUIPMENT
  // ==========================================

  const handleDelete = async (equipment) => {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${equipment.name}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    try {


      const token = localStorage.getItem('token')

      const response = await fetch(
        `http://localhost:5000/api/equipment/${equipment._id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )


      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete equipment'
        )
      }

      // Remove deleted equipment from screen
      setMyEquipment(prevEquipment =>
        prevEquipment.filter(
          item => item._id !== equipment._id
        )
      )

      // Update equipment count
      setEquipmentCount(prevCount =>
        Math.max(prevCount - 1, 0)
      )

      alert('Equipment deleted successfully.')

    } catch (error) {

      console.error(
        'Delete equipment error:',
        error
      )

      alert(
        error.message ||
        'Failed to delete equipment.'
      )
    }
  }


  return (
    <div>

      {/* NAVBAR */}

      <Navbar />

      {/* PAGE HEADER */}

      <section className="page-header">

        <h1>
          Welcome, {user ? user.name : 'Farmer'} 👋
        </h1>

        <p>
          Manage your equipment, bookings and farming activities.
        </p>

      </section>


      {/* DASHBOARD SUMMARY */}

      <section className="dashboard">

        <div className="dashboard-card">

          <span>🚜</span>

          <h3>
            My Equipment
          </h3>

          <strong>
            {equipmentCount}
          </strong>

          <p>
            Equipment Listed
          </p>

        </div>


        <div className="dashboard-card">

          <span>📅</span>

          <h3>
            My Bookings
          </h3>

          <strong>
            {bookingCount}
          </strong>

          <p>
            Total Bookings
          </p>

        </div>


        <div className="dashboard-card">

          <span>⏳</span>

          <h3>
            Pending Requests
          </h3>

          <strong>
            {pendingCount}
          </strong>

          <p>
            Waiting for approval
          </p>

        </div>


        <div className="dashboard-card">

          <span>💰</span>

          <h3>
            Equipment Earnings
          </h3>

          <strong>
            ₹{earnings}
          </strong>

          <p>
            Total Earnings
          </p>

        </div>

      </section>


      {/* MY EQUIPMENT */}

      <section className="equipment-section">

        <h2>
          🚜 My Equipment
        </h2>

        <p>
          Manage the equipment you have listed on AgroShare.
        </p>


        {myEquipment.length === 0 ? (

          <div className="no-equipment">

            <p>
              You have not listed any equipment yet.
            </p>

            <Link
              to="/add-equipment"
              className="primary-btn"
            >
              + Add Equipment
            </Link>

          </div>

        ) : (

          <div className="equipment-cards">

            {myEquipment.map((item) => (

              <div
                className="equipment-card"
                key={item._id}
              >

                {/* IMAGE */}

                <div className="equipment-icon">

                  {item.imageUrl ? (

                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '160px',
                        objectFit: 'contain',
                        borderRadius: '10px'
                      }}
                    />

                  ) : (

                    <span
                      style={{
                        fontSize: '60px'
                      }}
                    >

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


                {/* DETAILS */}

                <h3>
                  {item.name}
                </h3>

                <p>
                  {item.type}
                </p>

                <p>
                  📍 {item.location}
                </p>

                <p>
                  💰 ₹{item.pricePerDay}/day
                </p>

                <p>
                  {item.availability
                    ? '🟢 Available'
                    : '🔴 Not Available'}
                </p>


                {/* OWNER OPTIONS */}

                <div className="equipment-actions">

                  {/* VIEW */}

                  <Link
                    to={`/equipment/${item._id}`}
                    className="card-btn"
                  >
                    👁 View
                  </Link>


                  {/* EDIT */}

                  <button
                    className="card-btn"
                    onClick={() => {
                      navigate(
                        `/edit-equipment/${item._id}`
                      )
                    }}
                  >
                    ✏️ Edit
                  </button>


                  {/* DELETE */}

                  <button
                    className="card-btn"
                    onClick={() => {
                      handleDelete(item)
                    }}
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  )
}

export default Dashboard