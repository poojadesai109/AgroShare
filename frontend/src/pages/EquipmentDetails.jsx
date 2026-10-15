import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './pages.css'

function EquipmentDetails() {

    const { id } = useParams()
    const navigate = useNavigate()

    const [equipment, setEquipment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // New states for availability
    const [bookedDates, setBookedDates] = useState([])
    const [selectedDate, setSelectedDate] = useState(null)

    useEffect(() => {
        fetchEquipment()
    }, [id])

    // Fetch equipment details
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

            // Fetch booked dates for this equipment
            const bookingResponse = await fetch(
                `http://localhost:5000/api/bookings/equipment/${id}`
            )

            if (bookingResponse.ok) {

                const dates = await bookingResponse.json()

                setBookedDates(dates)

            }

        } catch (error) {

            console.error('Equipment details error:', error)
            setError('Unable to load equipment')

        } finally {

            setLoading(false)

        }
    }
    const isDateBooked = (date) => {

        const formattedDate = date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })

        return bookedDates.includes(formattedDate)
    }

    const handleBooking = async () => {

        const user = JSON.parse(localStorage.getItem('user'))

        if (!user) {
            alert('Please login before booking equipment.')
            navigate('/login')
            return
        }

        if (!selectedDate) {
            alert('Please select a booking date.')
            return
        }
        const selectedDateText = selectedDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })

        if (bookedDates.includes(selectedDateText)) {

            alert(
                `This equipment is already booked on ${selectedDateText}. Please select another date.`
            )

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
                        date: selectedDateText,
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

                <Navbar />

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

           <Navbar />


            <section className="page-header">

                <h1>{equipment.name}</h1>

                <p>
                    Equipment details and booking information
                </p>

            </section>

            <section className="equipment-page">

                <div className="equipment-item equipment-details-card">

                    <div className="equipment-details-icon">
                        {equipment.imageUrl ? (
                            <img
                                src={equipment.imageUrl}
                                alt={equipment.name}
                                style={{
                                    width: '100%',
                                    height: '400px',
                                    objectFit: 'contain',
                                    borderRadius: '12px'
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: '90px' }}>🚜</span>
                        )}
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
                        {equipment.availability
                            ? 'Available'
                            : 'Not Available'}
                    </p>

                    {equipment.description && (
                        <p>
                            <strong>Description:</strong>{' '}
                            {equipment.description}
                        </p>
                    )}

                    {equipment.availability ? (

                        <div className="booking-panel">

                            <label>
                                <strong>Select Booking Date:</strong>
                            </label>

                            <br />

                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                filterDate={(date) => !isDateBooked(date)}
                                minDate={new Date()}
                                placeholderText="Select booking date"
                                dateFormat="dd MMMM yyyy"
                                className="booking-date-picker"
                            />

                            <div className="booked-dates-section">

                                <h3>Already Booked Dates</h3>

                                {bookedDates.length === 0 ? (

                                    <p className="no-booked-dates">
                                        No bookings yet. All dates are available.
                                    </p>

                                ) : (

                                    <div className="booked-dates-list">

                                        {bookedDates.map((date, index) => (

                                            <span
                                                className="booked-date"
                                                key={index}
                                            >
                                                {date}
                                            </span>

                                        ))}

                                    </div>

                                )}

                            </div>

                            <button
                                className="book-button"
                                onClick={handleBooking}
                                style={{ marginTop: '10px' }}
                            >
                                Book Equipment
                            </button>

                        </div>

                    ) : (

                        <p>
                            This equipment is currently unavailable.
                        </p>

                    )}

                    <br />

                    <Link to="/equipment" className="equipment-details-back">
                        ← Back to Equipment
                    </Link>

                </div>

            </section>

        </div>
    )
}

export default EquipmentDetails