
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './pages.css'

function ManageUsers() {
    const navigate = useNavigate()

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('farmer')

    const currentUser = JSON.parse(localStorage.getItem('user'))

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'admin') {
            navigate('/dashboard')
            return
        }

        const fetchUsers = async () => {
            try {
                setError('')
                setLoading(true)

                const token = localStorage.getItem('token')

                const response = await fetch(
                    'http://localhost:5000/api/admin/users',
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
                        errorData.message ||
                        (response.status === 401 || response.status === 403
                            ? 'You are not authorized to view registered users.'
                            : 'Failed to fetch registered users')
                    )
                }

                const data = await response.json()
                setUsers(data)
            } catch (err) {
                console.error('Manage users error:', err)
                setError(
                    err.message || 'Unable to load users. Please try again.'
                )
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [navigate])

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase()

        return users.filter((user) => {
            const matchesSearch = [
                user.name,
                user.email,
                user.phone,
                user.location,
                user.role
            ].some(value =>
                String(value || '').toLowerCase().includes(query)
            )

            const matchesRole =
                roleFilter === 'All' ||
                (user.role || 'farmer').toLowerCase() ===
                    roleFilter.toLowerCase()

            return matchesSearch && matchesRole
        })
    }, [users, search, roleFilter])

    const farmerCount = users.filter(
        user => (user.role || 'farmer').toLowerCase() === 'farmer'
    ).length

    const adminCount = users.filter(
        user => (user.role || '').toLowerCase() === 'admin'
    ).length

    if (!currentUser || currentUser.role !== 'admin') {
        return null
    }

    return (
        <div className="manage-users-page">
            <Navbar />

            <header className="mu-page-header">
                <div className="mu-header-inner">
                    <div>
                        <p className="mu-eyebrow">AGROSHARE ADMINISTRATION</p>
                        <h1>Manage Users</h1>
                        <p className="mu-subtitle">
                            View and monitor registered AgroShare accounts.
                        </p>
                    </div>

                    <Link to="/admin" className="mu-back-button">
                        ← Admin Dashboard
                    </Link>
                </div>
            </header>

            <main className="mu-content">
                <section className="mu-summary-grid">
                    <article className="mu-summary-card">
                        <div className="mu-summary-icon">👥</div>
                        <div>
                            <p>Total Users</p>
                            <h2>{users.length}</h2>
                            <span>Registered accounts</span>
                        </div>
                    </article>

                    <article className="mu-summary-card">
                        <div className="mu-summary-icon">🌾</div>
                        <div>
                            <p>Farmers</p>
                            <h2>{farmerCount}</h2>
                            <span>Farmer accounts</span>
                        </div>
                    </article>

                    <article className="mu-summary-card">
                        <div className="mu-summary-icon">🛡️</div>
                        <div>
                            <p>Administrators</p>
                            <h2>{adminCount}</h2>
                            <span>Admin accounts</span>
                        </div>
                    </article>
                </section>

                <section className="mu-table-card">
                    <div className="mu-table-heading">
                        <div>
                            <h2>Registered Users</h2>
                            <p>
                                Showing {filteredUsers.length} of {users.length} users
                            </p>
                        </div>
                    </div>

                    <div className="mu-filters">
                        <input
                            type="search"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search name, email, phone or location..."
                            aria-label="Search registered users"
                        />

                        <select
                            value={roleFilter}
                            onChange={event => setRoleFilter(event.target.value)}
                            aria-label="Filter users by role"
                        >
                            <option value="All">All account roles</option>
                            <option value="farmer">Farmers</option>
                            <option value="admin">Administrators</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="mu-state">
                            <div className="mu-loader" />
                            <p>Loading registered users...</p>
                        </div>
                    ) : error ? (
                        <div className="mu-state mu-error" role="alert">
                            <h3>Unable to load users</h3>
                            <p>{error}</p>
                            <button
                                className="mu-retry-button"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="mu-state">
                            <span className="mu-empty-icon">🔎</span>
                            <h3>No users found</h3>
                            <p>
                                Try another search term or change the role filter.
                            </p>
                        </div>
                    ) : (
                        <div className="mu-table-wrapper">
                            <table className="mu-table">
                                <thead>
                                    <tr>
                                        <th>No.</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Location</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.map((item, index) => {
                                        const role = (
                                            item.role || 'farmer'
                                        ).toLowerCase()

                                        return (
                                            <tr key={item._id}>
                                                <td className="mu-number">
                                                    {index + 1}
                                                </td>
                                                <td className="mu-name">
                                                    {item.name || '—'}
                                                </td>
                                                <td>{item.email || '—'}</td>
                                                <td>{item.phone || '—'}</td>
                                                <td>{item.location || '—'}</td>
                                                <td>
                                                    <span
                                                        className={`mu-role-badge ${
                                                            role === 'admin'
                                                                ? 'mu-role-admin'
                                                                : 'mu-role-farmer'
                                                        }`}
                                                    >
                                                        {role === 'admin'
                                                            ? 'Admin'
                                                            : 'Farmer'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <p className="mu-footer-note">
                    AgroShare · User account management
                </p>
            </main>
        </div>
    )
}

export default ManageUsers
