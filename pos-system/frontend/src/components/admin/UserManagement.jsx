import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EMPTY_FORM = {
  name: '',
  email: '',
  username: '',
  password: '',
  role: 'CASHIER',
  phone: '',
  isActive: true,
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(Array.isArray(data) ? data : data.content || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        // Update existing user
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't clear password if not changed
        await userService.updateUser(editingUser.id, payload);
        toast.success('User updated successfully');
      } else {
        // Create via auth/register endpoint
        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
        });
        toast.success('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || 'Operation failed';
      toast.error(typeof msg === 'string' ? msg : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await userService.updateUser(user.id, { ...user, isActive: !user.isActive });
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch ((role || '').toUpperCase()) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
      case 'CASHIER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'CUSTOMER': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <button
          onClick={() => { setEditingUser(null); setFormData(EMPTY_FORM); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlusIcon className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Last Login</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 font-bold">
                        {(user.name || user.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                      {(user.role || '').toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`px-2 py-1 text-xs rounded-full font-medium ${user.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setEditingUser(user); setFormData({ ...user, password: '' }); setShowModal(true); }}
                      className="text-primary-600 hover:text-primary-800 mr-3"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
            <Dialog.Title className="text-xl font-bold mb-5">
              {editingUser ? 'Edit User' : 'Add New User'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input type="text" value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="input-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input type="email" value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="input-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Username *</label>
                  <input type="text" value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="input-primary" required disabled={!!editingUser} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password {editingUser ? '(leave blank to keep)' : '*'}
                  </label>
                  <input type="password" value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="input-primary" required={!editingUser} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="tel" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="input-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role *</label>
                  <select value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="input-primary">
                    <option value="ADMIN">Admin</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="CUSTOMER">Customer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default UserManagement;