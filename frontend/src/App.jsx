import { BrowserRouter, Routes, Route } from 'react-router-dom'
import EquipmentDetails from './pages/EquipmentDetails'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Equipment from './pages/Equipment'
import AddEquipment from './pages/AddEquipment'
import Bookings from './pages/Bookings'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/add-equipment" element={<AddEquipment />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/equipment/:id" element={<EquipmentDetails />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App