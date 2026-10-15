import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./ManageBookings.css";

function ManageBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [bookingFilter, setBookingFilter] = useState("All");
    const [paymentFilter, setPaymentFilter] = useState("All");

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await fetch(
                    "http://localhost:5000/api/admin/bookings",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load bookings"
                    );
                }

                setBookings(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const filteredBookings = useMemo(() => {
        const query = search.trim().toLowerCase();

        return bookings.filter((booking) => {
            const matchesSearch = [
                booking.equipmentName,
                booking.farmerName,
                booking.owner,
                booking.location,
                booking.transactionId,
            ].some((value) =>
                String(value || "").toLowerCase().includes(query)
            );

            const matchesBookingStatus =
                bookingFilter === "All" ||
                booking.status === bookingFilter;

            const matchesPaymentStatus =
                paymentFilter === "All" ||
                (booking.paymentStatus || "Pending") === paymentFilter;

            return (
                matchesSearch &&
                matchesBookingStatus &&
                matchesPaymentStatus
            );
        });
    }, [bookings, search, bookingFilter, paymentFilter]);

    const pendingCount = bookings.filter(
        (booking) => booking.status === "Pending"
    ).length;

    const paidCount = bookings.filter(
        (booking) => booking.paymentStatus === "Paid"
    ).length;

    const formatDate = (value) => {
        if (!value) return "—";

        const parsed = new Date(value + "T00:00:00");

        return Number.isNaN(parsed.getTime())
            ? value
            : parsed.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
              });
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="admin-bookings-state">
                    <p>Loading bookings...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="admin-bookings-state admin-bookings-error">
                    <h2>Unable to load bookings</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="ab-primary-button"
                    >
                        Try Again
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="admin-bookings-page">
                <div className="ab-heading-row">
                    <div>
                        <p className="ab-eyebrow">AGROSHARE ADMINISTRATION</p>
                        <h1>Manage All Bookings</h1>
                        <p className="ab-subtitle">
                            Monitor booking requests and payment information.
                        </p>
                    </div>

                    <Link to="/admin" className="ab-back-button">
                        ← Admin Dashboard
                    </Link>
                </div>

                <section className="ab-summary">
                    <article className="ab-summary-card">
                        <span className="ab-summary-icon">📋</span>
                        <div>
                            <p>Total Bookings</p>
                            <h2>{bookings.length}</h2>
                        </div>
                    </article>

                    <article className="ab-summary-card">
                        <span className="ab-summary-icon">⏳</span>
                        <div>
                            <p>Pending Bookings</p>
                            <h2>{pendingCount}</h2>
                        </div>
                    </article>

                    <article className="ab-summary-card">
                        <span className="ab-summary-icon">💰</span>
                        <div>
                            <p>Paid Bookings</p>
                            <h2>{paidCount}</h2>
                        </div>
                    </article>
                </section>

                <section className="ab-table-card">
                    <div className="ab-table-heading">
                        <div>
                            <h2>Booking Records</h2>
                            <p>
                                Showing {filteredBookings.length} of{" "}
                                {bookings.length} bookings
                            </p>
                        </div>
                    </div>

                    <div className="ab-filters">
                        <input
                            type="search"
                            placeholder="Search equipment, renter, owner..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search bookings"
                        />

                        <select
                            value={bookingFilter}
                            onChange={(event) =>
                                setBookingFilter(event.target.value)
                            }
                            aria-label="Filter booking status"
                        >
                            <option value="All">All booking statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>

                        <select
                            value={paymentFilter}
                            onChange={(event) =>
                                setPaymentFilter(event.target.value)
                            }
                            aria-label="Filter payment status"
                        >
                            <option value="All">All payment statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Unpaid / Pending</option>
                        </select>
                    </div>

                    {filteredBookings.length === 0 ? (
                        <div className="ab-empty">
                            <span>🔎</span>
                            <h3>No bookings found</h3>
                            <p>Try another search term or change the filters.</p>
                        </div>
                    ) : (
                        <div className="ab-table-wrapper">
                            <table className="ab-bookings-table">
                                <thead>
                                    <tr>
                                        <th>Equipment</th>
                                        <th>Renter</th>
                                        <th>Owner</th>
                                        <th>Location</th>
                                        <th>Date</th>
                                        <th>Price / Day</th>
                                        <th>Booking Status</th>
                                        <th>Payment Status</th>
                                        <th>Payment Method</th>
                                        <th>Transaction ID</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking._id}>
                                            <td className="ab-equipment-name">
                                                {booking.equipmentName || "—"}
                                            </td>
                                            <td>{booking.farmerName || "—"}</td>
                                            <td>{booking.owner || "—"}</td>
                                            <td>{booking.location || "—"}</td>
                                            <td>{formatDate(booking.date)}</td>
                                            <td className="ab-price">
                                                ₹
                                                {Number(
                                                    booking.pricePerDay || 0
                                                ).toLocaleString("en-IN")}
                                            </td>
                                            <td>
                                                <span
                                                    className={`ab-status ab-booking-${String(
                                                        booking.status || "Pending"
                                                    ).toLowerCase()}`}
                                                >
                                                    {booking.status || "Pending"}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`ab-status ab-payment-${String(
                                                        booking.paymentStatus || "Pending"
                                                    ).toLowerCase()}`}
                                                >
                                                    {booking.paymentStatus || "Pending"}
                                                </span>
                                            </td>
                                            <td>
                                                {booking.paymentMethod || "—"}
                                            </td>
                                            <td className="ab-transaction">
                                                {booking.transactionId || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

export default ManageBookings;
