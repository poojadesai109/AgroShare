import { NavLink, Link, useNavigate } from 'react-router-dom'

function Navbar() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user'))

    const handleLogout = () => {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        navigate('/login')
        window.location.reload()
    }

    const getNavClass = ({ isActive }) =>
        isActive ? 'nav-link active' : 'nav-link'

    return (
        <header className={`navbar ${user?.role === 'admin' ? 'admin-navbar' : ''}`}>
            <Link to={user?.role === 'admin' ? '/admin' : '/'} className="logo">
                🌾 AgroShare
            </Link>

            <nav>
                {user?.role === 'admin' ? (
                    <NavLink
                        to="/admin"
                        end
                        className={getNavClass}
                    >
                        Admin Dashboard
                    </NavLink>
                ) : (
                    <>
                        <NavLink
                            to="/"
                            end
                            className={getNavClass}
                        >
                            Home
                        </NavLink>

                        <NavLink
                            to="/equipment"
                            className={getNavClass}
                        >
                            Equipment
                        </NavLink>

                        <NavLink
                            to="/bookings"
                            className={getNavClass}
                        >
                            Bookings
                        </NavLink>

                        {user && (
                            <NavLink
                                to="/dashboard"
                                className={getNavClass}
                            >
                                Dashboard
                            </NavLink>
                        )}
                    </>
                )}
            </nav>

            <div className="nav-buttons">
                {!user ? (
                    <>
                        <Link to="/login" className="login-btn">
                            Login
                        </Link>

                        <Link to="/register" className="register-btn">
                            Register
                        </Link>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="logout-btn"
                    >
                        Logout
                    </button>
                )}
            </div>
        </header>
    )
}

export default Navbar