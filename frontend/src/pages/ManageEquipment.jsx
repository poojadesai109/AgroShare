
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './pages.css'

function ManageEquipment() {
    const navigate = useNavigate()
    const [equipment, setEquipment] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deletingId, setDeletingId] = useState(null)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('All')
    const [availabilityFilter, setAvailabilityFilter] = useState('All')

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))

        if (!user || user.role !== 'admin') {
            navigate('/dashboard')
            return
        }

        fetchEquipment()
    }, [navigate])

    const fetchEquipment = async () => {
        try {
            setLoading(true)
            setError('')

            const token = localStorage.getItem('token')

            const response = await fetch(
                'http://localhost:5000/api/equipment',
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(
                    errorData.message || 'Failed to fetch equipment'
                )
            }

            const data = await response.json()
            setEquipment(data)
        } catch (err) {
            console.error('Manage equipment error:', err)
            setError(err.message || 'Unable to load equipment.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (item) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${item.name}"?`
        )

        if (!confirmed) return

        try {
            setDeletingId(item._id)

            const token = localStorage.getItem('token')

            const response = await fetch(
                `http://localhost:5000/api/equipment/${item._id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                }
            )

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to delete equipment'
                )
            }

            // Remove only the successfully deleted equipment.
            setEquipment((previous) =>
                previous.filter(
                    (equipmentItem) => equipmentItem._id !== item._id
                )
            )

            alert('Equipment deleted successfully.')
        } catch (err) {
            console.error('Delete equipment error:', err)
            alert(err.message || 'Unable to delete equipment.')
        } finally {
            setDeletingId(null)
        }
    }

    const user = JSON.parse(localStorage.getItem('user'))

    const types = useMemo(
        () => [...new Set(equipment.map(item => item.type).filter(Boolean))],
        [equipment]
    )

    const filteredEquipment = useMemo(() => {
        const term = search.trim().toLowerCase()

        return equipment.filter(item => {
            const matchesSearch = [
                item.name,
                item.owner,
                item.location,
                item.type
            ].some(value =>
                String(value || '').toLowerCase().includes(term)
            )

            const matchesType =
                typeFilter === 'All' || item.type === typeFilter

            const matchesAvailability =
                availabilityFilter === 'All' ||
                (availabilityFilter === 'Available' &&
                    item.availability === true) ||
                (availabilityFilter === 'Unavailable' &&
                    item.availability === false)

            return matchesSearch && matchesType && matchesAvailability
        })
    }, [equipment, search, typeFilter, availabilityFilter])

    if (!user || user.role !== 'admin') {
        return null
    }

    const availableCount = equipment.filter(
        item => item.availability === true
    ).length

    const unavailableCount = equipment.length - availableCount

    return (
        <div className="me-page">
            <Navbar />

            <section className="page-header">
                <h1>Manage Equipment</h1>
                <p>View and manage all listed agricultural equipment</p>
            </section>

            <section className="me-content">
                <Link className="me-back-link" to="/admin">
                    ← Back to Admin Dashboard
                </Link>

                <div className="me-heading">
                    <div>
                        <h2>Listed Equipment</h2>
                        <p>
                            Monitor equipment shared by AgroShare farmers.
                        </p>
                    </div>

                    <span className="me-total">
                        {equipment.length} listings
                    </span>
                </div>

                {!loading && !error && (
                    <div className="me-stats">
                        <div className="me-stat">
                            <span>Total Equipment</span>
                            <strong>{equipment.length}</strong>
                        </div>

                        <div className="me-stat">
                            <span>Available</span>
                            <strong>{availableCount}</strong>
                        </div>

                        <div className="me-stat">
                            <span>Unavailable</span>
                            <strong>{unavailableCount}</strong>
                        </div>
                    </div>
                )}

                <div className="me-filters">
                    <input
                        type="search"
                        aria-label="Search equipment"
                        placeholder="Search equipment, owner or location..."
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                    />

                    <select
                        aria-label="Filter by equipment type"
                        value={typeFilter}
                        onChange={event => setTypeFilter(event.target.value)}
                    >
                        <option value="All">All equipment types</option>

                        {types.map(type => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by availability"
                        value={availabilityFilter}
                        onChange={event =>
                            setAvailabilityFilter(event.target.value)
                        }
                    >
                        <option value="All">All availability</option>
                        <option value="Available">Available</option>
                        <option value="Unavailable">Unavailable</option>
                    </select>
                </div>

                {loading ? (
                    <p className="me-message">Loading equipment...</p>
                ) : error ? (
                    <div className="me-message me-error">
                        <p role="alert">{error}</p>
                        <button onClick={fetchEquipment}>
                            Retry
                        </button>
                    </div>
                ) : equipment.length === 0 ? (
                    <div className="me-message">
                        <span className="me-empty-icon">🚜</span>
                        <h3>No equipment listed yet</h3>
                        <p>
                            Equipment added by farmers will appear here.
                        </p>
                    </div>
                ) : filteredEquipment.length === 0 ? (
                    <div className="me-message">
                        <h3>No matching equipment</h3>
                        <p>Try changing your search or filters.</p>

                        <button
                            onClick={() => {
                                setSearch('')
                                setTypeFilter('All')
                                setAvailabilityFilter('All')
                            }}
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="me-results">
                            Showing {filteredEquipment.length} of{' '}
                            {equipment.length} listings
                        </p>

                        <div className="me-grid">
                            {filteredEquipment.map(item => (
                                <article
                                    className="me-card"
                                    key={item._id}
                                >
                                    <div className="me-image-wrap">
                                        {item.imageUrl ? (
                                            <img
                                                className="me-image"
                                                src={item.imageUrl}
                                                alt={item.name}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="me-image-placeholder">
                                                🚜
                                            </div>
                                        )}

                                        <span
                                            className={`me-status ${
                                                item.availability
                                                    ? 'is-available'
                                                    : 'is-unavailable'
                                            }`}
                                        >
                                            {item.availability
                                                ? 'Available'
                                                : 'Unavailable'}
                                        </span>
                                    </div>

                                    <div className="me-card-body">
                                        <span className="me-type">
                                            {item.type || 'Equipment'}
                                        </span>

                                        <h3>{item.name}</h3>

                                        <div className="me-details">
                                            <p>
                                                <span>Owner</span>
                                                <strong>
                                                    {item.owner || 'Not specified'}
                                                </strong>
                                            </p>

                                            <p>
                                                <span>Location</span>
                                                <strong>
                                                    {item.location || 'Not specified'}
                                                </strong>
                                            </p>
                                        </div>

                                        <div className="me-card-footer">
                                            <div>
                                                <span className="me-price-label">
                                                    Rental price
                                                </span>

                                                <strong className="me-price">
                                                    ₹{item.pricePerDay}{' '}
                                                    <small>/ day</small>
                                                </strong>
                                            </div>

                                            <button
                                                className="me-delete"
                                                onClick={() => handleDelete(item)}
                                                disabled={
                                                    deletingId === item._id
                                                }
                                            >
                                                {deletingId === item._id
                                                    ? 'Deleting...'
                                                    : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    )
}

export default ManageEquipment
