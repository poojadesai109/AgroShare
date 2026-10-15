import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './pages.css'

function EditEquipment() {

  const { id } = useParams()
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user'))

  const [name, setName] = useState('')
  const [type, setType] = useState('Tractor')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [availability, setAvailability] = useState('true')

  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)


  // ==========================================
  // LOAD EXISTING EQUIPMENT
  // ==========================================

  useEffect(() => {

    const fetchEquipment = async () => {

      try {

        const response = await fetch(
          'http://localhost:5000/api/equipment'
        )

        const data = await response.json()

        const equipment = data.find(
          item => item._id === id
        )

        if (!equipment) {
          setMessage('Equipment not found.')
          return
        }

        // Owner check
        if (
          user &&
          user.role !== 'admin' &&
          equipment.owner !== user.name
        ) {
          setMessage(
            'You are not allowed to edit this equipment.'
          )
          return
        }

        setName(equipment.name || '')
        setType(equipment.type || 'Tractor')
        setDescription(equipment.description || '')
        setLocation(equipment.location || '')
        setPricePerDay(equipment.pricePerDay || '')
        setAvailability(
          equipment.availability ? 'true' : 'false'
        )

        if (equipment.imageUrl) {
          setImagePreview(equipment.imageUrl)
        }

      } catch (error) {

        console.error(
          'Error fetching equipment:',
          error
        )

        setMessage(
          'Failed to load equipment.'
        )
      }
    }

    fetchEquipment()

  }, [id])


  // ==========================================
  // IMAGE CHANGE
  // ==========================================

  const handleImageChange = (e) => {

    const file = e.target.files[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {

      setMessage(
        'Please select a valid image file.'
      )

      return
    }

    if (file.size > 5 * 1024 * 1024) {

      setMessage(
        'Image size must be less than 5 MB.'
      )

      return
    }

    setImage(file)

    setImagePreview(
      URL.createObjectURL(file)
    )

    setMessage('')
  }


  // ==========================================
  // UPDATE EQUIPMENT
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault()

    if (!user) {
      setMessage(
        'Please login before editing equipment.'
      )
      return
    }

    if (
      !name ||
      !type ||
      !location ||
      !pricePerDay
    ) {

      setMessage(
        'Please fill all required fields.'
      )

      return
    }

    if (Number(pricePerDay) <= 0) {

      setMessage(
        'Price must be greater than 0.'
      )

      return
    }

    setLoading(true)
    setMessage('')

    try {

      const formData = new FormData()

      formData.append('name', name)
      formData.append('type', type)
      formData.append(
        'description',
        description
      )
      formData.append(
        'location',
        location
      )
      formData.append(
        'pricePerDay',
        Number(pricePerDay)
      )
      formData.append(
        'availability',
        availability === 'true'
      )

      // Add new image only if selected
      if (image) {
        formData.append('image', image)
      }

      const token = localStorage.getItem('token')

      const response = await fetch(
        `http://localhost:5000/api/equipment/${id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      )

      const data = await response.json()

      if (!response.ok) {

        throw new Error(
          data.message ||
          'Failed to update equipment'
        )
      }

      setMessage(
        'Equipment updated successfully!'
      )

      setTimeout(() => {
        navigate('/dashboard')
      }, 800)

    } catch (error) {

      console.error(
        'Equipment update error:',
        error
      )

      setMessage(
        error.message ||
        'Something went wrong.'
      )

    } finally {

      setLoading(false)

    }
  }


  // ==========================================
  // PAGE
  // ==========================================

  return (

    <div>

      {/* NAVBAR */}

      <Navbar />


      {/* HEADER */}

      <section className="page-header">

        <h1>
          ✏️ Edit Equipment
        </h1>

        <p>
          Update your equipment details.
        </p>

      </section>


      {/* FORM */}

      <section className="form-section">

        <form
          className="equipment-form"
          onSubmit={handleSubmit}
        >

          {/* NAME */}

          <label>
            Equipment Name *
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />


          {/* TYPE */}

          <label>
            Equipment Type *
          </label>

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
          >

            <option value="Tractor">
              Tractor
            </option>

            <option value="Harvester">
              Harvester
            </option>

            <option value="Rotavator">
              Rotavator
            </option>

            <option value="Tillage Equipment">
              Tillage Equipment
            </option>

            <option value="Irrigation Equipment">
              Irrigation Equipment
            </option>

            <option value="Other">
              Other
            </option>

          </select>


          {/* DESCRIPTION */}

          <label>
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows="4"
          />


          {/* LOCATION */}

          <label>
            Location *
          </label>

          <input
            type="text"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
            required
          />


          {/* PRICE */}

          <label>
            Price Per Day (₹) *
          </label>

          <input
            type="number"
            value={pricePerDay}
            onChange={(e) =>
              setPricePerDay(e.target.value)
            }
            min="1"
            required
          />


          {/* AVAILABILITY */}

          <label>
            Availability
          </label>

          <select
            value={availability}
            onChange={(e) =>
              setAvailability(e.target.value)
            }
          >

            <option value="true">
              Available
            </option>

            <option value="false">
              Not Available
            </option>

          </select>


          {/* IMAGE */}

          <label>
            Equipment Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          <small>
            Leave empty to keep the current image.
          </small>


          {/* IMAGE PREVIEW */}

          {imagePreview && (

            <div
              style={{
                marginTop: '15px',
                textAlign: 'center'
              }}
            >

              <p>
                <strong>
                  Image Preview
                </strong>
              </p>

              <img
                src={imagePreview}
                alt={name}
                style={{
                  width: '250px',
                  height: '180px',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  border: '1px solid #ddd'
                }}
              />

            </div>

          )}


          {/* MESSAGE */}

          {message && (

            <p
              style={{
                marginTop: '15px'
              }}
            >
              {message}
            </p>

          )}


          {/* BUTTONS */}

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px'
            }}
          >

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading
                ? 'Updating...'
                : '💾 Update Equipment'}
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                navigate('/dashboard')
              }
            >
              Cancel
            </button>

          </div>

        </form>

      </section>

    </div>
  )
}

export default EditEquipment