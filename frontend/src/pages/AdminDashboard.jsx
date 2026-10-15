
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './pages.css'

function AdminDashboard() {
    const navigate = useNavigate()

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEquipment: 0,
        totalBookings: 0,
        pendingBookings: 0,
        paidPayments: 0
    })

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const user = JSON.parse(localStorage.getItem('user'))

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/dashboard')
            return
        }

        const fetchStats = async () => {
            try {
                setError('')
                setLoading(true)

                const token = localStorage.getItem('token')

                const response = await fetch(
                    'http://localhost:5000/api/admin/stats',
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token
                                ? { Authorization: `Bearer ${token}` }
                                : {})
                        }
                    }
                )

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(
                        errorData.message || 'Failed to fetch statistics'
                    )
                }

                const data = await response.json()
                setStats(data)
            } catch (err) {
                console.error('Admin statistics error:', err)
                setError(
                    err.message ||
                    'Unable to load statistics. Please try again.'
                )
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [navigate])

    if (!user || user.role !== 'admin') {
        return null
    }

    const cards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: '👨‍🌾',
            description: 'Registered users',
            style: 'users'
        },
        {
            title: 'Total Equipment',
            value: stats.totalEquipment,
            icon: '🚜',
            description: 'Listed agricultural equipment',
            style: 'equipment'
        },
        {
            title: 'Total Bookings',
            value: stats.totalBookings,
            icon: '📋',
            description: 'All booking requests',
            style: 'bookings'
        },
        {
            title: 'Pending Bookings',
            value: stats.pendingBookings,
            icon: '⏳',
            description: 'Awaiting owner response',
            style: 'pending'
        },
        {
            title: 'Paid Payments',
            value: stats.paidPayments,
            icon: '💰',
            description: 'Payments marked as paid',
            style: 'payments'
        }
    ]

    return (
        <div className="ad-page">
            <Navbar />

            <section className="ad-page-header">
                <div>
                    <span className="ad-eyebrow">AGROSHARE ADMINISTRATION</span>
                    <h1>Admin Dashboard</h1>
                    <p>Manage your platform activities in one place.</p>
                </div>
            </section>

            <main className="ad-content">
                <section className="ad-welcome">
                    <div className="ad-welcome-icon">✦</div>
                    <div>
                        <h2>Welcome, {user.name || 'Administrator'} 👋</h2>
                        <p>
                            You are logged in as{' '}
                            <strong>Administrator</strong>.
                        </p>
                    </div>
                    <span className="ad-role-badge">Administrator</span>
                </section>

                <div className="ad-section-heading">
                    <div>
                        <h2>Platform Overview</h2>
                        <p>Current activity across AgroShare.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="ad-state">
                        <div className="ad-spinner" />
                        <p>Loading dashboard statistics...</p>
                    </div>
                ) : error ? (
                    <div className="ad-state ad-error" role="alert">
                        <h3>Unable to load statistics</h3>
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <div className="ad-stats-grid">
                        {cards.map((card) => (
                            <article
                                className="ad-stat-card"
                                key={card.title}
                            >
                                <div className={`ad-stat-icon ad-${card.style}`}>
                                    {card.icon}
                                </div>
                                <p className="ad-stat-title">{card.title}</p>
                                <h3>{card.value}</h3>
                                <p className="ad-stat-description">
                                    {card.description}
                                </p>
                            </article>
                        ))}
                    </div>
                )}

                <section className="ad-management">
                    <div className="ad-section-heading">
                        <div>
                            <h2>Platform Management</h2>
                            <p>Choose a section to view and manage.</p>
                        </div>
                    </div>

                    <div className="ad-management-grid">
                        <Link
                            to="/admin/users"
                            className="ad-management-card"
                        >
                            <span className="ad-management-icon">👨‍🌾</span>
                            <span className="ad-management-text">
                                <strong>Manage Users</strong>
                                <small>
                                    View registered farmers and administrators.
                                </small>
                            </span>
                            <span className="ad-arrow">→</span>
                        </Link>

                        <Link
                            to="/admin/equipment"
                            className="ad-management-card"
                        >
                            <span className="ad-management-icon">🚜</span>
                            <span className="ad-management-text">
                                <strong>Manage Equipment</strong>
                                <small>
                                    Review and manage equipment listings.
                                </small>
                            </span>
                            <span className="ad-arrow">→</span>
                        </Link>

                        <Link
                            to="/admin/bookings"
                            className="ad-management-card"
                        >
                            <span className="ad-management-icon">📋</span>
                            <span className="ad-management-text">
                                <strong>Manage All Bookings</strong>
                                <small>
                                    Review booking and payment statuses.
                                </small>
                            </span>
                            <span className="ad-arrow">→</span>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default AdminDashboard
