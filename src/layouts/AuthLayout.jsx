import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-50">
            {/* Left side: branding / illustration area */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-primary-600 text-white p-12 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform -translate-x-1/3 translate-y-1/3"></div>

                <div className="relative z-10 max-w-lg text-center">
                    <h1 className="text-4xl font-bold mb-6 font-sans">Ticket Management System</h1>
                    <p className="text-lg text-primary-100 mb-8 leading-relaxed">
                        Streamline your workflow, manage tasks efficiently, and deliver projects on time. Experience seamless collaboration.
                    </p>
                    <div className="mt-12 w-full h-64 rounded-xl glass-card flex items-center justify-center p-8 bg-white/10 border-white/10 shadow-2xl backdrop-blur-sm">
                        {/* Mock Dashboard Illustration */}
                        <div className="w-full h-full flex flex-col gap-3">
                            <div className="h-6 w-1/3 bg-white/30 rounded"></div>
                            <div className="flex-1 flex gap-4">
                                <div className="w-1/4 bg-white/20 rounded-lg"></div>
                                <div className="flex-1 bg-white/20 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Form area */}
            <div className="flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-10 text-center">
                        <h1 className="text-3xl font-bold text-primary-600">TMS</h1>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                    {subtitle && <p className="text-gray-500 mb-8">{subtitle}</p>}

                    <div className="w-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
