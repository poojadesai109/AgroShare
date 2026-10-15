import { BrowserRouter, Routes, Route } from 'react-router-dom'
import EquipmentDetails from './pages/EquipmentDetails'
import ManageUsers from './pages/ManageUsers'
import ManageEquipment from './pages/ManageEquipment'
import ManageBookings from './pages/ManageBookings'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Equipment from './pages/Equipment'
import AddEquipment from './pages/AddEquipment'
import Bookings from './pages/Bookings'
import Dashboard from './pages/Dashboard'
import EditEquipment from './pages/EditEquipment'
import Payment from './pages/Payment'
import AdminDashboard from './pages/AdminDashboard'


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
        <Route
          path="/edit-equipment/:id" element={<EditEquipment />} />
        <Route path="/payment/:id" element={<Payment />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/equipment" element={<ManageEquipment />} />
        <Route path="/admin/bookings" element={<ManageBookings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App