'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiUser, FiMail, FiShield, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiPlus, FiEdit2, FiTrash2, FiSearch, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { UserModal } from '../../../components/users/UserModal';
import ConfirmationToastComponent from '../../../components/ConfirmationToast';

// Add custom styles for the confirmation toast
const customToastStyles = {
    background: 'white',
    color: '#333',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderRadius: '0.5rem',
    padding: '1rem',
    minWidth: '300px',
    maxWidth: '400px'
};

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    active: boolean;
}

export default function UserAccessPage() {
    const { user: currentUser } = useSelector((state: RootState) => state.userLogin);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const itemsPerPage = 10;
    const router = useRouter();

    useEffect(() => {
        fetchUsers();
    }, [currentPage, roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    role: roleFilter !== 'all' ? roleFilter : undefined,
                    active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
                    search: searchQuery || undefined
                }
            });

            const usersData = Array.isArray(response.data.data) ? response.data.data : [];
            setUsers(usersData);

            const total = response.data.total || 0;
            setTotalPages(Math.ceil(total / itemsPerPage));
        } catch (error) {
            toast.error('Failed to fetch users');
            setUsers([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetchUsers = useCallback(
        debounce(() => {
            setCurrentPage(1);
            fetchUsers();
        }, 500),
        [roleFilter, statusFilter, searchQuery]
    );

    useEffect(() => {
        debouncedFetchUsers();
        return () => {
            debouncedFetchUsers.cancel();
        };
    }, [roleFilter, statusFilter, searchQuery]);

    const handleCreateUser = async (userData: { name: string; email: string; role: 'admin' | 'user'; active: boolean }) => {
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/users`,
                userData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.status === 201) {
                toast.success('User created successfully');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Failed to create user');
        }
    };

    const handleUpdateUser = async (userData: { name: string; email: string; role: 'admin' | 'user'; active: boolean }) => {
        if (!selectedUser) return;

        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/users/${selectedUser._id}`,
                userData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.status === 200) {
                toast.success('User updated successfully');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Failed to update user');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === currentUser?._id) {
            toast.error('You cannot delete your own account');
            return;
        }

        toast.info(
            <ConfirmationToastComponent
                onConfirm={async () => {
                    try {
                        const response = await axios.delete(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            }
                        );

                        if (response.status === 200) {
                            toast.success('User deleted successfully');
                            fetchUsers();
                        }
                    } catch (error) {
                        toast.error('Failed to delete user');
                    }
                }}
            />,
            {
                autoClose: false,
                closeOnClick: false,
                position: "top-center",
                className: 'toast-custom',
                style: customToastStyles
            }
        );
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
        if (userId === currentUser?._id) {
            toast.error('You cannot change your own role');
            return;
        }

        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
                { role: newRole },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.status === 200) {
                toast.success('User role updated successfully');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Failed to update user role');
        }
    };

    const handleStatusChange = async (userId: string, newStatus: boolean) => {
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
                { active: newStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.status === 200) {
                toast.success('User status updated successfully');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleModalSubmit = (userData: { name: string; email: string; role: 'admin' | 'user'; active: boolean }) => {
        if (selectedUser && selectedUser._id === currentUser?._id) {
            // Keep the current role and status for the current user
            userData.role = selectedUser.role;
            userData.active = selectedUser.active;
        }
        if (selectedUser) {
            handleUpdateUser(userData);
        } else {
            handleCreateUser(userData);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center mb-6">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mr-4">
                    <FiArrowLeft /> Back
                </button>
                <h1 className="text-2xl font-bold">User Access Management</h1>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => {
                                setSelectedUser(null);
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                        >
                            <FiPlus className="h-5 w-5" />
                            Add New User
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <FiUser className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FiMail className="h-5 w-5 text-gray-400 mr-2" />
                                                <div className="text-sm text-gray-900">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value as 'admin' | 'user')}
                                                disabled={user._id === currentUser?._id}
                                                className={`text-sm text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    user._id === currentUser?._id ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="user">User</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={user.active ? 'active' : 'inactive'}
                                                onChange={(e) => handleStatusChange(user._id, e.target.value === 'active')}
                                                disabled={user._id === currentUser?._id}
                                                className={`text-sm text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    user._id === currentUser?._id ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                                    title="Edit User"
                                                >
                                                    <FiEdit2 className="h-5 w-5" />
                                                </button>
                                                {user._id !== currentUser?._id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="p-1 text-red-600 hover:text-red-800 transition-colors duration-200"
                                                        title="Delete User"
                                                    >
                                                        <FiTrash2 className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                        Showing {users.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)} of {totalPages * itemsPerPage} results
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <FiChevronLeft className="h-5 w-5" />
                        </button>
                        {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 rounded-md ${currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <FiChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedUser(null);
                }}
                onSubmit={handleModalSubmit}
                initialData={selectedUser || undefined}
                isCurrentUser={selectedUser?._id === currentUser?._id}
            />
            <ToastContainer />
        </div>
    );
} 