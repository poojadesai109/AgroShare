
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function Payment() {
  const location = useLocation()
  const navigate = useNavigate()

  const booking = location.state?.booking

  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [paymentDate, setPaymentDate] = useState('')

  if (!booking) {
    return (
      <div style={styles.container}>
        <h1>Payment</h1>
        <p>Booking information was not received.</p>

        <button
          onClick={() => navigate('/bookings')}
          style={styles.secondaryButton}
        >
          ← Back to Bookings
        </button>
      </div>
    )
  }

  const handlePayment = async () => {
    setProcessing(true)

    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/${booking._id}/payment`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ paymentMethod })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Payment failed')
        return
      }

      setTransactionId(data.transactionId)
      setPaymentDate(new Date().toLocaleString('en-IN'))
      setSuccess(true)
    } catch (error) {
      console.error(error)
      alert('Unable to process payment')
    } finally {
      setProcessing(false)
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>

          <h1 style={styles.successTitle}>
            Payment Successful!
          </h1>

          <p style={styles.successSubtitle}>
            Your payment request has been processed.
          </p>

          <div style={styles.receipt}>
            <h2 style={styles.equipmentName}>
              {booking.equipmentName}
            </h2>

            <div style={styles.amount}>
              ₹{booking.pricePerDay}
            </div>

            <p style={styles.amountLabel}>Amount</p>

            <div style={styles.divider} />

            <div style={styles.detailRow}>
              <span>Payment Method</span>
              <strong>{paymentMethod}</strong>
            </div>

            <div style={styles.detailRow}>
              <span>Transaction ID</span>
              <strong style={styles.transactionId}>
                {transactionId || 'Not provided'}
              </strong>
            </div>

            <div style={styles.detailRow}>
              <span>Payment Date</span>
              <strong>{paymentDate}</strong>
            </div>

            <div style={styles.detailRow}>
              <span>Payment Status</span>
              <strong style={styles.paid}>Paid</strong>
            </div>
          </div>

          <button
            onClick={() => navigate('/bookings')}
            style={styles.primaryButton}
          >
            ← Back to My Bookings
          </button>

          <p style={styles.footerNote}>
            AgroShare · Payment Receipt
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.paymentCard}>
        <h1 style={styles.heading}>💳 Dummy Payment</h1>
        <p style={styles.subtitle}>
          Review your booking and select a payment method.
        </p>

        <div style={styles.divider} />

        <h2 style={styles.equipmentName}>
          {booking.equipmentName}
        </h2>

        <div style={styles.bookingDetails}>
          <p>📍 <strong>Location:</strong> {booking.location}</p>
          <p>📅 <strong>Date:</strong> {booking.date}</p>
          <p>👨‍🌾 <strong>Owner:</strong> {booking.owner}</p>
        </div>

        <div style={styles.paymentAmount}>
          Amount to pay: ₹{booking.pricePerDay}
        </div>

        <h3 style={styles.sectionHeading}>
          Select Payment Method
        </h3>

        {[
          { value: 'UPI', label: '📱 UPI' },
          { value: 'Card', label: '💳 Card' },
          { value: 'Cash', label: '💵 Cash' }
        ].map((method) => (
          <label
            key={method.value}
            style={{
              ...styles.methodOption,
              borderColor:
                paymentMethod === method.value ? '#198754' : '#dce5dc',
              backgroundColor:
                paymentMethod === method.value ? '#f0faf3' : '#fff'
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.value}
              checked={paymentMethod === method.value}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>{method.label}</span>
          </label>
        ))}

        <button
          onClick={handlePayment}
          disabled={processing}
          style={{
            ...styles.primaryButton,
            opacity: processing ? 0.7 : 1,
            cursor: processing ? 'not-allowed' : 'pointer'
          }}
        >
          {processing
            ? 'Processing...'
            : `💳 Pay ₹${booking.pricePerDay}`}
        </button>

        <button
          onClick={() => navigate('/bookings')}
          style={styles.textButton}
          disabled={processing}
        >
          Cancel and return to bookings
        </button>

        <p style={styles.footerNote}>
          Demo payment interface · AgroShare
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '80vh',
    padding: '40px 16px',
    backgroundColor: '#f5f8f5',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box'
  },
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '30px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif'
  },
  paymentCard: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '32px',
    backgroundColor: '#fff',
    border: '1px solid #e0e8e0',
    borderRadius: '16px',
    boxShadow: '0 8px 28px rgba(28, 65, 35, 0.08)',
    boxSizing: 'border-box'
  },
  successCard: {
    maxWidth: '620px',
    margin: '0 auto',
    padding: '36px',
    backgroundColor: '#fff',
    border: '1px solid #dce8dc',
    borderRadius: '18px',
    boxShadow: '0 8px 30px rgba(28, 65, 35, 0.08)',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  successIcon: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    borderRadius: '50%',
    backgroundColor: '#198754',
    color: '#fff',
    fontSize: '42px',
    lineHeight: '64px',
    fontWeight: 'bold'
  },
  successTitle: {
    color: '#167638',
    fontSize: 'clamp(27px, 5vw, 38px)',
    margin: '0 0 10px'
  },
  successSubtitle: {
    color: '#667366',
    marginBottom: '28px',
    lineHeight: 1.5
  },
  heading: {
    margin: '0 0 8px',
    color: '#213d29',
    fontSize: '28px'
  },
  subtitle: {
    color: '#687568',
    lineHeight: 1.5
  },
  equipmentName: {
    color: '#263b2a',
    margin: '12px 0 20px',
    fontSize: '23px'
  },
  bookingDetails: {
    color: '#4e5d50',
    lineHeight: 1.6,
    overflowWrap: 'anywhere'
  },
  paymentAmount: {
    margin: '24px 0',
    padding: '18px',
    borderRadius: '10px',
    backgroundColor: '#f0f8f1',
    color: '#176c35',
    fontSize: '23px',
    fontWeight: 'bold'
  },
  sectionHeading: {
    marginTop: '26px',
    color: '#263b2a'
  },
  methodOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px',
    margin: '12px 0',
    border: '1px solid #dce5dc',
    borderRadius: '9px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  receipt: {
    padding: '24px',
    margin: '20px 0 24px',
    backgroundColor: '#f8faf8',
    border: '1px solid #e5ece5',
    borderRadius: '12px',
    textAlign: 'left',
    overflowWrap: 'anywhere'
  },
  amount: {
    color: '#176c35',
    fontSize: '36px',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  amountLabel: {
    color: '#778177',
    textAlign: 'center',
    marginTop: '4px'
  },
  divider: {
    height: '1px',
    backgroundColor: '#e2e9e2',
    margin: '22px 0'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '12px 0',
    borderBottom: '1px solid #e9eee9',
    color: '#526052',
    fontSize: '14px'
  },
  transactionId: {
    color: '#293c2c',
    textAlign: 'right',
    overflowWrap: 'anywhere',
    maxWidth: '60%'
  },
  paid: {
    color: '#198754'
  },
  primaryButton: {
    width: '100%',
    marginTop: '20px',
    padding: '14px 20px',
    backgroundColor: '#198754',
    color: '#fff',
    border: 'none',
    borderRadius: '9px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '12px 20px',
    border: '1px solid #cbd8cb',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  textButton: {
    display: 'block',
    width: '100%',
    marginTop: '14px',
    padding: '10px',
    backgroundColor: 'transparent',
    color: '#526052',
    border: 'none',
    cursor: 'pointer'
  },
  footerNote: {
    marginTop: '22px',
    color: '#8a948a',
    fontSize: '12px'
  }
}

export default Payment
