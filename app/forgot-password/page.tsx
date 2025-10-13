'use client'
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLock, FiMail, FiArrowLeft } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);

            // Call the login API endpoint
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgotpassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    
                }),
                credentials: 'include' // Important for cookies/sessions
            });

            const data = await response.json();



            if (!response.ok) {

                toast.error(data.error)
                return;
            }

            // Login successful
            toast.success('Login successful!');

            // Store token in localStorage (if using JWT)
            if (data.token) {
                localStorage.setItem('token', data.token);
            }


            router.push('/dashboard');


        } catch (error: any) {
            toast.error(error.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex items-center p-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mr-4">
                    <FiArrowLeft /> Back
                </button>
            </div>
            {/* Left side - Graphic/Image */}
            <div className="hidden lg:block w-1/2 bg-gradient-to-br from-blue-600 to-indigo-900">
                <div className="h-full flex items-center justify-center p-12">
                    <div className="text-white text-center">
                        <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
                        <p className="text-xl opacity-90">Connect with your data analytics dashboard</p>
                        <div className="mt-8">
                            <div className="w-64 h-64 mx-auto bg-white bg-opacity-10 rounded-full backdrop-blur-sm"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-gray-800">G Dashboard</h2>
                        <p className="mt-2 text-gray-600">Enter your email to get recovery link</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiMail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Email address"
                                required
                            />
                        </div>




                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : 'Submit'}
                        </button>
                    </form>

                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default ForgotPassword;