import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './pages.css'

function AddEquipment() {

  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [availability, setAvailability] = useState('true')

  // Image states
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImageChange = (e) => {

    const file = e.target.files[0]

    if (!file) {
      return
    }

    // Allow only image files
    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file.')
      return
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5 MB.')
      return
    }

    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    setMessage('')
  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    setMessage('')
    setLoading(true)

    const user = JSON.parse(localStorage.getItem('user'))

    if (!user) {
      setMessage('Please login before adding equipment.')
      setLoading(false)
      return
    }

    try {

      // Create FormData because we are sending an image
      const formData = new FormData()

      formData.append('name', name)
      formData.append('type', type)
      formData.append('description', description)
      formData.append('owner', user.name)
      formData.append('location', location)
      formData.append('pricePerDay', Number(pricePerDay))
      formData.append(
        'availability',
        availability === 'true'
      )

      // Image is optional
      if (image) {
        formData.append('image', image)
      }


      const token = localStorage.getItem('token')

      const response = await fetch(
        'http://localhost:5000/api/equipment',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      )


      const data = await response.json()

      if (!response.ok) {
        setMessage(
          data.message || 'Failed to add equipment'
        )
        setLoading(false)
        return
      }

      alert('Equipment added successfully!')

      // Go to Equipment page
      navigate('/equipment')

    } catch (error) {

      console.error('Add equipment error:', error)
      setMessage('Unable to connect to the server')

    }

    setLoading(false)
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

      </header>

      <section className="form-page">

        <div className="form-card">

          <h1>List Your Equipment</h1>

          <p>
            Share your agricultural equipment with other farmers.
          </p>

          <form onSubmit={handleSubmit}>

            <label>Equipment Name</label>

            <input
              type="text"
              placeholder="Example: Mahindra Tractor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label>Equipment Type</label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >

              <option value="">
                Select equipment type
              </option>

              <option value="Tractor">
                Tractor
              </option>

              <option value="Harvester">
                Harvester
              </option>

              <option value="Rotavator">
                Rotavator
              </option>
              <option value="Tillage Equipment">Tillage Equipment</option>

              <option value="Irrigation Equipment">
                Irrigation Equipment
              </option>

              <option value="Other">
                Other
              </option>

            </select>

            <label>Description</label>

            <textarea
              rows="4"
              placeholder="Describe your equipment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>

            {/* Equipment Image */}

            <label>Equipment Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            <small>
              Optional — Upload a photo of your equipment (Max 5 MB)
            </small>

            {imagePreview && (
              <div style={{ marginTop: '15px' }}>

                <p>Image Preview:</p>

                <img
                  src={imagePreview}
                  alt="Equipment Preview"
                  style={{
                    width: '220px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    border: '1px solid #ddd'
                  }}
                />

              </div>
            )}

            <label>Location</label>

            <input
              type="text"
              placeholder="Enter equipment location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <label>Price per Day (₹)</label>

            <input
              type="number"
              placeholder="Example: 800"
              min="1"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(e.target.value)}
              required
            />

            <label>Availability</label>

            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >

              <option value="true">
                Available
              </option>

              <option value="false">
                Not Available
              </option>

            </select>

            {message && (
              <p className="auth-message">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >

              {loading
                ? 'Adding Equipment...'
                : 'Add Equipment'}

            </button>

          </form>

        </div>

      </section>

    </div>
  )
}

export default AddEquipment