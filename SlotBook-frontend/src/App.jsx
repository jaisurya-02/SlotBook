import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import NavBar from './components/NavBar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Resources from './pages/Resources.jsx'
import Profile from './pages/Profile.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BookSlot from './pages/BookSlot.jsx'
import Approvals from './pages/Approvals.jsx'
import ApprovalDetails from './pages/ApprovalDetails.jsx'
import ResourceDetails from './pages/ResourceDetails.jsx'
import Notifications from './pages/Notifications.jsx'

const App = () => {
  return (
    <div className="app-shell">
      <NavBar />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/resources/:id" element={<ResourceDetails />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/approvals/:id" element={<ApprovalDetails />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/bookslot" element={<BookSlot />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  )
}

export default App
