import { Link } from 'react-router-dom'
import { useState } from 'react'
import Navbar from '../components/Navbar'
import './pages.css'

function Home() {

  const [crop, setCrop] = useState('')
  const [landSize, setLandSize] = useState('')
  const [equipmentType, setEquipmentType] = useState('')
  const [location, setLocation] = useState('')
  const [budget, setBudget] = useState('')

  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const getRecommendation = async () => {

    if (!crop || !landSize || !equipmentType || !location || !budget) {
      setMessage('Please fill all fields.')
      setRecommendations([])
      return
    }

    setLoading(true)
    setMessage('')
    setRecommendations([])

    try {

      const response = await fetch(
        'http://localhost:5000/api/recommendations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            crop,
            landSize,
            equipmentType,
            location,
            budget
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get recommendations')
      }

      setRecommendations(data.recommendations || [])

      if (!data.recommendations || data.recommendations.length === 0) {
        setMessage('No suitable equipment found.')
      }

    } catch (error) {
      console.error(error)
      setMessage('Unable to get recommendations. Make sure the backend is running.')
    }

    setLoading(false)
  }

  return (
    <div>

      <Navbar />


      {/* HERO SECTION */}

      <section className="hero-section">

        <div className="hero-content">

          <p className="tagline">
            SMART AGRICULTURAL EQUIPMENT SHARING
          </p>

          <h1>
            Share Equipment.
            <br />
            <span>Grow Together.</span>
          </h1>

          <p className="hero-text">
            Find agricultural equipment from nearby farmers,
            reduce farming costs and make better equipment decisions.
          </p>

          <div className="hero-buttons">

            <Link
              to="/equipment"
              className="primary-btn"
            >
              Find Equipment
            </Link>

            <Link
              to="/add-equipment"
              className="secondary-btn"
            >
              List Your Equipment
            </Link>

          </div>

        </div>

        <div className="hero-image">

          <div className="tractor-card">
            🚜
          </div>

        </div>

      </section>


      {/* AVAILABLE EQUIPMENT */}

      <section className="equipment-section">

        <h2>
          Available Equipment
        </h2>

        <p>
          Find the right agricultural equipment for your farm.
        </p>

        <div className="equipment-cards">

          <div className="equipment-card">

            <div className="equipment-icon">
              🚜
            </div>

            <h3>
              Tractors
            </h3>

            <p>
              Powerful tractors available for farming operations.
            </p>

            <Link
              to="/equipment"
              className="card-btn"
            >
              View Equipment
            </Link>

          </div>


          <div className="equipment-card">

            <div className="equipment-icon">
              🌾
            </div>

            <h3>
              Harvesters
            </h3>

            <p>
              Harvesting equipment available from nearby owners.
            </p>

            <Link
              to="/equipment"
              className="card-btn"
            >
              View Equipment
            </Link>

          </div>


          <div className="equipment-card">

            <div className="equipment-icon">
              💧
            </div>

            <h3>
              Irrigation Equipment
            </h3>

            <p>
              Equipment to support efficient irrigation.
            </p>

            <Link
              to="/equipment"
              className="card-btn"
            >
              View Equipment
            </Link>

          </div>

        </div>

      </section>


      {/* DECISION SUPPORT */}

      <section className="decision-section">

        <h2>
          🌱 Decision Support
        </h2>

        <p>
          Enter your farming requirements and AgroShare will
          recommend suitable equipment available from farmers.
        </p>


        <div className="decision-form">

          <div className="form-group">

            <label>
              Crop
            </label>

            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            >

              <option value="">
                Select Crop
              </option>

              <option value="Wheat">
                Wheat
              </option>

              <option value="Rice">
                Rice
              </option>

              <option value="Cotton">
                Cotton
              </option>

              <option value="Maize">
                Maize
              </option>

              <option value="Sugarcane">
                Sugarcane
              </option>

              <option value="Groundnut">
                Groundnut
              </option>

            </select>

          </div>


          <div className="form-group">

            <label>
              Land Size (acres)
            </label>

            <input
              type="number"
              min="0"
              placeholder="Example: 5"
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
            />

          </div>


          <div className="form-group">

            <label>
              Equipment Type
            </label>

            <select
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
            >

              <option value="">
                Select Equipment
              </option>

              <option value="Tractor">
                Tractor
              </option>

              <option value="Harvester">
                Harvester
              </option>

              <option value="Tillage">
                Tillage
              </option>

              <option value="Irrigation">
                Irrigation
              </option>

            </select>

          </div>


          <div className="form-group">

            <label>
              Location
            </label>

            <input
              type="text"
              placeholder="Example: Vijayapura"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

          </div>


          <div className="form-group">

            <label>
              Budget (₹)
            </label>

            <input
              type="number"
              min="0"
              placeholder="Example: 5000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />

          </div>


          <button
            className="recommend-btn"
            onClick={getRecommendation}
            disabled={loading}
          >

            {loading
              ? 'Finding Equipment...'
              : '🌱 Get Recommendation'
            }

          </button>

        </div>


        {/* MESSAGE */}

        {message && (

          <p className="recommendation-message">
            {message}
          </p>

        )}


        {/* RECOMMENDATIONS */}

        {recommendations.length > 0 && (

          <div className="recommendations">

            <h3>
              Recommended Equipment
            </h3>


            <div className="recommendation-cards">

              {recommendations.map((equipment) => (

                <div
                  className="recommendation-card"
                  key={equipment._id}
                >

                  <h4>
                    🚜 {equipment.name}
                  </h4>

                  <p>
                    <strong>Type:</strong> {equipment.type}
                  </p>

                  <p>
                    <strong>Location:</strong> {equipment.location}
                  </p>

                  <p>

                    <strong>Price:</strong> ₹{equipment.pricePerDay}/day

                  </p>

                  <p>
                    <strong>Availability:</strong> Available
                  </p>

                  <Link
                    to={`/equipment/${equipment._id}`}
                    className="card-btn"
                  >
                    View Equipment
                  </Link>

                </div>

              ))}

            </div>

          </div>

        )}

      </section>


      {/* HOW IT WORKS */}

      <section className="how-section">

        <h2>
          How It Works
        </h2>

        <div className="steps">

          <div className="step">

            <div className="step-number">
              1
            </div>

            <h3>
              Register
            </h3>

            <p>
              Create your farmer account.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              2
            </div>

            <h3>
              Find Equipment
            </h3>

            <p>
              Search equipment available for sharing.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              3
            </div>

            <h3>
              Book
            </h3>

            <p>
              Request equipment for your required dates.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              4
            </div>

            <h3>
              Use & Return
            </h3>

            <p>
              Use the equipment and return it safely.
            </p>

          </div>

        </div>

      </section>


      <footer>

        <p>
          © 2026 Smart Agricultural Equipment Sharing and Decision Support System
        </p>

      </footer>

    </div>
  )
}

export default Home