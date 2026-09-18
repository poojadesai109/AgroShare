import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './pages.css'

function EquipmentDetails() {

    const { id } = useParams()
    const navigate = useNavigate()

    const [equipment, setEquipment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchEquipment()
    }, [id])

    const fetchEquipment = async () => {

        try {

            const response = await fetch(
                'http://localhost:5000/api/equipment'
            )

            if (!response.ok) {
                throw new Error('Failed to fetch equipment')
            }

            const data = await response.json()

            const selectedEquipment = data.find(
                (item) => item._id === id
            )

            if (!selectedEquipment) {
                setError('Equipment not found')
                return
            }

            setEquipment(selectedEquipment)

        } catch (error) {

            console.error('Equipment details error:', error)
            setError('Unable to load equipment')

        } finally {

            setLoading(false)

        }
    }

    const handleBooking = async () => {

        const user = JSON.parse(localStorage.getItem('user'))

        if (!user) {
            alert('Please login before booking equipment.')
            navigate('/login')
            return
        }

        const date = prompt(
            `Enter booking date for ${equipment.name} (Example: 15 September 2026)`
        )

        if (!date) {
            return
        }

        try {

            const response = await fetch(
                'http://localhost:5000/api/bookings',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        equipmentId: equipment._id,
                        equipmentName: equipment.name,
                        farmerId: user.id,
                        farmerName: user.name,
                        owner: equipment.owner,
                        location: equipment.location,
                        date: date,
                        pricePerDay: equipment.pricePerDay
                    })
                }
            )

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

    if (loading) {
        return <p>Loading equipment...</p>
    }

    if (error) {
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
                    <h1>{error}</h1>

                    <Link to="/equipment">
                        Back to Equipment
                    </Link>
                </section>

            </div>
        )
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

                <h1>{equipment.name}</h1>

                <p>
                    Equipment details and booking information
                </p>

            </section>

            <section className="equipment-page">

                <div className="equipment-item">

                    <div className="equipment-item-icon">
                        🚜
                    </div>

                    <h2>{equipment.name}</h2>

                    <p>
                        <strong>Type:</strong> {equipment.type}
                    </p>

                    <p>
                        <strong>Location:</strong> {equipment.location}
                    </p>

                    <p>
                        <strong>Owner:</strong> {equipment.owner}
                    </p>

                    <p>
                        <strong>Price:</strong> ₹{equipment.pricePerDay} / day
                    </p>

                    <p>
                        <strong>Availability:</strong>{' '}
                        {equipment.availability ? 'Available' : 'Not Available'}
                    </p>

                    {equipment.description && (
                        <p>
                            <strong>Description:</strong>{' '}
                            {equipment.description}
                        </p>
                    )}

                    {equipment.availability ? (
                        <button
                            className="book-button"
                            onClick={handleBooking}
                        >
                            Book Equipment
                        </button>
                    ) : (
                        <p>
                            This equipment is currently unavailable.
                        </p>
                    )}

                    <br />

                    <Link to="/equipment">
                        ← Back to Equipment
                    </Link>

                </div>

            </section>

        </div>
    )
}

export default EquipmentDetails