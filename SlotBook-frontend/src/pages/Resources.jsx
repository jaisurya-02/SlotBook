import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import axiosInstance from '../api/axios'
import ResourceCard from '../components/ResourceCard'
import { toast } from 'react-toastify'

const Resources = () => {
  const [searchParams] = useSearchParams()
  const [resources, setResources] = useState([])
  const [filteredResources, setFilteredResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddForm, setShowAddForm] = useState(searchParams.get('add') === '1')
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingResourceId, setEditingResourceId] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Classroom',
    location: '',
    capacity: 1,
    features: '',
    imageUrl: '',
    availability: true,
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    category: 'Classroom',
    location: '',
    capacity: 1,
    features: '',
    imageUrl: '',
    availability: true,
  })

  const categories = ['All', 'Classroom', 'Lab', 'Hall', 'Sports Facility', 'Equipment', 'Open Ground', 'Other']

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const decoded = jwtDecode(token)
      setIsAdmin(decoded.role === 'admin')
    } catch {
      setIsAdmin(false)
    }
  }, [])

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    filterResources()
  }, [selectedCategory, searchQuery, resources])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/resources')
      setResources(response.data.resources || [])
      setFilteredResources(response.data.resources || [])
    } catch (error) {
      toast.error('Failed to fetch resources', {
        position: 'top-right',
        autoClose: 3000,
      })
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResources = () => {
    let filtered = resources

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((resource) => resource.category === selectedCategory)
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((resource) =>
        resource.name.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.location.toLowerCase().includes(query)
      )
    }

    setFilteredResources(filtered)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const openEditForm = (resource) => {
    setShowAddForm(false)
    setEditingResourceId(resource._id)
    setEditFormData({
      name: resource.name || '',
      description: resource.description || '',
      category: resource.category || 'Classroom',
      location: resource.location || '',
      capacity: resource.capacity || 1,
      features: Array.isArray(resource.features) ? resource.features.join(', ') : '',
      imageUrl: resource.imageUrl || '',
      availability: resource.availability ?? true,
    })
    setShowEditForm(true)
  }

  const handleCreateResource = async (e) => {
    e.preventDefault()

    if (!isAdmin) {
      toast.error('Only admin can add resources')
      return
    }

    setCreating(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        capacity: Number(formData.capacity),
        features: formData.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        imageUrl: formData.imageUrl.trim() || null,
        availability: formData.availability,
      }

      const response = await axiosInstance.post('/resources', payload)
      const created = response.data.resource
      setResources((prev) => [created, ...prev])
      toast.success('Resource added successfully')

      setFormData({
        name: '',
        description: '',
        category: 'Classroom',
        location: '',
        capacity: 1,
        features: '',
        imageUrl: '',
        availability: true,
      })
      setShowAddForm(false)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add resource')
      console.error('Error creating resource:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateResource = async (e) => {
    e.preventDefault()

    if (!isAdmin || !editingResourceId) {
      toast.error('Only admin can edit resources')
      return
    }

    setEditing(true)
    try {
      const payload = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        category: editFormData.category,
        location: editFormData.location.trim(),
        capacity: Number(editFormData.capacity),
        features: editFormData.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        imageUrl: editFormData.imageUrl.trim() || null,
        availability: editFormData.availability,
      }

      const response = await axiosInstance.put(`/resources/${editingResourceId}`, payload)
      const updated = response.data.resource
      setResources((prev) => prev.map((r) => (r._id === editingResourceId ? updated : r)))
      toast.success('Resource updated successfully')
      setShowEditForm(false)
      setEditingResourceId('')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update resource')
      console.error('Error updating resource:', error)
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteResource = async (resource) => {
    if (!isAdmin) {
      toast.error('Only admin can delete resources')
      return
    }

    const confirmed = window.confirm(`Delete resource "${resource.name}"? This action cannot be undone.`)
    if (!confirmed) return

    setDeletingId(resource._id)
    try {
      await axiosInstance.delete(`/resources/${resource._id}`)
      setResources((prev) => prev.filter((r) => r._id !== resource._id))
      toast.success('Resource deleted successfully')

      if (editingResourceId === resource._id) {
        setShowEditForm(false)
        setEditingResourceId('')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete resource')
      console.error('Error deleting resource:', error)
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="min-h-screen app-shell text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-4">Available Resources</h1>
            <p className="text-gray-400 text-lg">Browse and book from our collection of facilities and equipment</p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setShowEditForm(false)
                setShowAddForm((prev) => !prev)
              }}
              className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
            >
              {showAddForm ? 'Close Add Form' : 'Add Resource'}
            </button>
          )}
        </div>

        {isAdmin && showAddForm && (
          <form onSubmit={handleCreateResource} className="mb-8 glass-panel p-6 space-y-4">
            <h2 className="text-2xl font-bold">Create New Resource</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                >
                  {categories.filter((c) => c !== 'All').map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Location</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Features (comma-separated)</label>
                <input
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  placeholder="Projector, AC, Whiteboard"
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Image URL (optional)</label>
                <input
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="availability"
                  type="checkbox"
                  name="availability"
                  checked={formData.availability}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                />
                <label htmlFor="availability" className="text-gray-300">Mark as available</label>
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="px-5 py-3 bg-white text-black font-semibold hover:bg-gray-200 transition-colors disabled:opacity-60"
            >
              {creating ? 'Adding...' : 'Add Resource'}
            </button>
          </form>
        )}

        {isAdmin && showEditForm && (
          <form onSubmit={handleUpdateResource} className="mb-8 glass-panel p-6 space-y-4">
            <h2 className="text-2xl font-bold">Edit Resource</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Name</label>
                <input
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Category</label>
                <select
                  name="category"
                  value={editFormData.category}
                  onChange={handleEditInputChange}
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                >
                  {categories.filter((c) => c !== 'All').map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  required
                  rows={3}
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Location</label>
                <input
                  name="location"
                  value={editFormData.location}
                  onChange={handleEditInputChange}
                  required
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={editFormData.capacity}
                  onChange={handleEditInputChange}
                  required
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Features (comma-separated)</label>
                <input
                  name="features"
                  value={editFormData.features}
                  onChange={handleEditInputChange}
                  placeholder="Projector, AC, Whiteboard"
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Image URL (optional)</label>
                <input
                  name="imageUrl"
                  value={editFormData.imageUrl}
                  onChange={handleEditInputChange}
                  placeholder="https://..."
                  className="glass-input w-full px-4 py-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="availability-edit"
                  type="checkbox"
                  name="availability"
                  checked={editFormData.availability}
                  onChange={handleEditInputChange}
                  className="h-4 w-4"
                />
                <label htmlFor="availability-edit" className="text-gray-300">Mark as available</label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={editing}
                className="px-5 py-3 bg-white text-black font-semibold hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                {editing ? 'Updating...' : 'Update Resource'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false)
                  setEditingResourceId('')
                }}
                className="px-5 py-3 bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mb-8 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search resources by name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full px-4 py-3 pl-12 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-20 transition-all"
            />
            <svg className="w-6 h-6 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-white text-black'
                    : 'glass-panel-soft text-gray-300 hover:bg-gray-700/70'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="text-gray-400">
            Showing <span className="text-white font-semibold">{filteredResources.length}</span> of{' '}
            <span className="text-white font-semibold">{resources.length}</span> resources
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
              <p className="text-gray-300 text-sm">Loading resources...</p>
            </div>
          </div>
        )}

        {!loading && filteredResources.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">No resources found</h3>
            <p className="text-gray-500">Try adjusting your filters or search query</p>
          </div>
        )}

        {!loading && filteredResources.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                showAdminActions={isAdmin}
                onEdit={() => openEditForm(resource)}
                onDelete={() => handleDeleteResource(resource)}
                isDeleting={deletingId === resource._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Resources

