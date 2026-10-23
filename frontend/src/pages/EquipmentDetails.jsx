
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './pages.css'

const API_URL = 'http://localhost:5000'

function EquipmentDetails() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [equipment, setEquipment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [bookedDates, setBookedDates] = useState([])
    const [selectedDate, setSelectedDate] = useState(null)

    // Ratings and reviews
    const [reviews, setReviews] = useState([])
    const [averageRating, setAverageRating] = useState(0)
    const [totalReviews, setTotalReviews] = useState(0)
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewComment, setReviewComment] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)
    const [reviewMessage, setReviewMessage] = useState('')
    const [reviewError, setReviewError] = useState('')

    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user'))
        } catch {
            return null
        }
    })

    useEffect(() => {
        fetchEquipment()
    }, [id])

    useEffect(() => {
        fetchReviews()
    }, [id])

    // Refresh the logged-in user when returning to this page.
    useEffect(() => {
        const syncUser = () => {
            try {
                setUser(JSON.parse(localStorage.getItem('user')))
            } catch {
                setUser(null)
            }
        }

        window.addEventListener('focus', syncUser)
        window.addEventListener('storage', syncUser)

        return () => {
            window.removeEventListener('focus', syncUser)
            window.removeEventListener('storage', syncUser)
        }
    }, [])

    const fetchEquipment = async () => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch(`${API_URL}/api/equipment`)

            if (!response.ok) {
                throw new Error('Failed to fetch equipment')
            }

            const data = await response.json()
            const selectedEquipment = data.find(item => item._id === id)

            if (!selectedEquipment) {
                setError('Equipment not found')
                return
            }

            setEquipment(selectedEquipment)

            const bookingResponse = await fetch(
                `${API_URL}/api/bookings/equipment/${id}`
            )

            if (bookingResponse.ok) {
                const dates = await bookingResponse.json()
                setBookedDates(dates)
            }
        } catch (err) {
            console.error('Equipment details error:', err)
            setError('Unable to load equipment')
        } finally {
            setLoading(false)
        }
    }

    const fetchReviews = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/reviews/equipment/${id}`
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch reviews')
            }

            setReviews(data.reviews || [])
            setAverageRating(data.averageRating || 0)
            setTotalReviews(data.totalReviews || 0)
        } catch (err) {
            console.error('Fetch reviews error:', err)
            // A review-loading failure should not break equipment booking.
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
        const currentUser = user

        if (!currentUser) {
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
            const response = await fetch(`${API_URL}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    equipmentId: equipment._id,
                    equipmentName: equipment.name,
                    farmerId: currentUser.id,
                    farmerName: currentUser.name,
                    owner: equipment.owner,
                    location: equipment.location,
                    date: selectedDateText,
                    pricePerDay: equipment.pricePerDay
                })
            })

            const data = await response.json()

            if (!response.ok) {
                alert(data.message || 'Booking failed')
                return
            }

            alert('Booking request sent successfully!')
            navigate('/bookings')
        } catch (err) {
            console.error('Booking error:', err)
            alert('Unable to send booking request')
        }
    }

    const handleReviewSubmit = async (event) => {
        event.preventDefault()
        setReviewMessage('')
        setReviewError('')

        if (!user) {
            alert('Please login before submitting a review.')
            navigate('/login')
            return
        }

        if (!reviewComment.trim() || reviewComment.trim().length < 3) {
            setReviewError('Please write at least 3 characters.')
            return
        }

        if (reviewComment.trim().length > 1000) {
            setReviewError('Your review cannot exceed 1000 characters.')
            return
        }

        setSubmittingReview(true)

        try {
            const response = await fetch(`${API_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingId: reviewBookingId,
                    farmerId: user.id,
                    farmerName: user.name,
                    rating: reviewRating,
                    comment: reviewComment.trim()
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Unable to submit review')
            }

            setReviewMessage('Thank you! Your review was submitted.')
            setReviewComment('')
            setReviewRating(5)
            await fetchReviews()
        } catch (err) {
            setReviewError(err.message)
        } finally {
            setSubmittingReview(false)
        }
    }

    // The current backend review endpoint requires a booking ID.
    // Load this farmer's bookings and let them choose an eligible booking.
    const [myBookings, setMyBookings] = useState([])
    const [reviewBookingId, setReviewBookingId] = useState('')
    const selectedBookingAlreadyReviewed = reviews.some(
        review => String(review.bookingId) === String(reviewBookingId)
    )

    useEffect(() => {
        const fetchMyBookings = async () => {
            if (!user?.id) {
                setMyBookings([])
                return
            }

            try {
                const response = await fetch(
                    `${API_URL}/api/bookings/${user.id}`
                )

                if (!response.ok) return

                const data = await response.json()

                const eligibleBookings = (Array.isArray(data) ? data : []).filter(
                    booking =>
                        String(booking.equipmentId) === String(id) &&
                        booking.status === 'Approved' &&
                        booking.paymentStatus === 'Paid'
                )

                setMyBookings(eligibleBookings)
                setReviewBookingId(previous =>
                    eligibleBookings.some(
                        booking => booking._id === previous
                    )
                        ? previous
                        : eligibleBookings[0]?._id || ''
                )
            } catch (err) {
                console.error('Fetch farmer bookings error:', err)
            }
        }

        fetchMyBookings()
    }, [id, user?.id])

    if (loading) {
        return <p>Loading equipment...</p>
    }

    if (error || !equipment) {
        return (
            <div>
                <Navbar />
                <section className="page-header">
                    <h1>{error || 'Equipment not found'}</h1>
                    <Link to="/equipment">Back to Equipment</Link>
                </section>
            </div>
        )
    }

    return (
        <div>
            <Navbar />

            <section className="page-header">
                <h1>{equipment.name}</h1>
                <p>Equipment details and booking information</p>
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

                    <p><strong>Type:</strong> {equipment.type}</p>
                    <p><strong>Location:</strong> {equipment.location}</p>
                    <p><strong>Owner:</strong> {equipment.owner}</p>
                    <p>
                        <strong>Price:</strong> ₹{equipment.pricePerDay} / day
                    </p>
                    <p>
                        <strong>Availability:</strong>{' '}
                        {equipment.availability ? 'Available' : 'Not Available'}
                    </p>

                    {equipment.description && (
                        <p>
                            <strong>Description:</strong> {equipment.description}
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
                                onChange={setSelectedDate}
                                filterDate={date => !isDateBooked(date)}
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
                        <p>This equipment is currently unavailable.</p>
                    )}

                    <br />

                    <Link to="/equipment" className="equipment-details-back">
                        ← Back to Equipment
                    </Link>
                </div>
            </section>

            {/* Ratings and Reviews */}
            <section className="equipment-page">
                <div className="equipment-item equipment-details-card">
                    <h2>⭐ Ratings &amp; Reviews</h2>

                    <div style={{ marginBottom: '20px' }}>
                        <h3>
                            {averageRating.toFixed(1)} / 5 ⭐
                        </h3>
                        <p>
                            Based on {totalReviews}{' '}
                            {totalReviews === 1 ? 'review' : 'reviews'}
                        </p>
                    </div>

                    {reviews.length === 0 ? (
                        <p>No reviews yet. Be the first to share your experience!</p>
                    ) : (
                        <div>
                            {reviews.map(review => (
                                <div
                                    key={review._id}
                                    style={{
                                        borderTop: '1px solid #ddd',
                                        padding: '15px 0'
                                    }}
                                >
                                    <strong>{review.farmerName}</strong>
                                    <p style={{ margin: '6px 0' }}>
                                        {'⭐'.repeat(review.rating)}
                                        {'☆'.repeat(5 - review.rating)}
                                    </p>
                                    <p>{review.comment}</p>
                                    <small>
                                        {review.createdAt
                                            ? new Date(review.createdAt).toLocaleDateString()
                                            : ''}
                                    </small>
                                </div>
                            ))}
                        </div>
                    )}

                    <hr style={{ margin: '24px 0' }} />

                    <h3>Write a Review</h3>

                    {!user ? (
                        <p>
                            Please <Link to="/login">login</Link> to submit a review.
                        </p>
                    ) : myBookings.length === 0 ? (
                        <p>
                            You need an approved and paid booking for this equipment
                            before submitting a review.
                        </p>
                    ) : selectedBookingAlreadyReviewed ? (
                        <p style={{ color: 'green' }}>
                            You have already reviewed this booking. Thank you for sharing your experience! ❤️
                        </p>
                    ) : (
                        <form onSubmit={handleReviewSubmit}>
                            <label htmlFor="reviewBooking">
                                <strong>Select booking:</strong>
                            </label>
                            <br />

                            <select
                                id="reviewBooking"
                                value={reviewBookingId}
                                onChange={event => setReviewBookingId(event.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    margin: '8px 0 16px'
                                }}
                            >
                                {myBookings.map(booking => (
                                    <option key={booking._id} value={booking._id}>
                                        {booking.date} — {booking.equipmentName}
                                    </option>
                                ))}
                            </select>

                            <label>
                                <strong>Your rating:</strong>
                            </label>

                            <div style={{ margin: '10px 0 16px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                        onClick={() => setReviewRating(star)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '28px',
                                            padding: '2px',
                                            color: star <= reviewRating ? '#f5a623' : '#aaa'
                                        }}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span style={{ marginLeft: '8px' }}>
                                    {reviewRating}/5
                                </span>
                            </div>

                            <label htmlFor="reviewComment">
                                <strong>Your review:</strong>
                            </label>

                            <textarea
                                id="reviewComment"
                                value={reviewComment}
                                onChange={event => setReviewComment(event.target.value)}
                                placeholder="Share your experience with this equipment..."
                                minLength={3}
                                maxLength={1000}
                                required
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    margin: '8px 0 12px',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <button
                                className="book-button"
                                type="submit"
                                disabled={submittingReview || !reviewBookingId}
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>

                            {reviewMessage && (
                                <p style={{ color: 'green' }}>{reviewMessage}</p>
                            )}

                            {reviewError && (
                                <p style={{ color: 'red' }}>{reviewError}</p>
                            )}
                        </form>
                    )}

                    {reviewMessage && myBookings.length === 0 && (
                        <p style={{ color: 'green' }}>{reviewMessage}</p>
                    )}

                    {reviewError && myBookings.length === 0 && (
                        <p style={{ color: 'red' }}>{reviewError}</p>
                    )}
                </div>
            </section>
        </div>
    )
}

export default EquipmentDetails
