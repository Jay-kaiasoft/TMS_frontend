import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import AuthLayout from '../../layouts/AuthLayout';
import CustomInput from '../../components/common/CustomInput';
import { Button, CircularProgress } from '@mui/material';
import { forgotPassword } from '../../services/authService';
import { setAlert, setLoading } from '../../redux/commonReducers/commonReducers';

const ForgotPassword = ({ setAlert, setLoading, loading }) => {
    const navigate = useNavigate();

    const { control, handleSubmit } = useForm({
        defaultValues: { email: '' }
    });

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            await forgotPassword(data.email);
            setAlert({ open: true, message: "If the email exists, a password reset link has been sent.", type: 'success' });
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to process request', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('tms_token');
        if (token) {
            navigate('/dashboard');
        }
    }, [])

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your email to receive a password reset link."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <CustomInput
                    name="email"
                    type="email"
                    control={control}
                    label="Email Address"
                    rules={{ required: 'Email is required' }}
                />
                <div className='mt-3'>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={loading}
                        className="h-12 text-base font-semibold shadow-md"
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                    </Button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Remember your password?{' '}
                    <Link to="/" className="text-primary-600 font-semibold hover:underline">
                        Log in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};

const mapStateToProps = (state) => ({
    loading: state.common.loading,
});

const mapDispatchToProps = {
    setAlert,
    setLoading
};

export default connect(mapStateToProps, mapDispatchToProps)(ForgotPassword);
