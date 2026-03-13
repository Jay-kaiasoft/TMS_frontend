import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import AuthLayout from '../../layouts/AuthLayout';
import CustomInput from '../../components/common/CustomInput';
import { Button, CircularProgress } from '@mui/material';
import { setAlert, setLoading } from '../../redux/commonReducers/commonReducers';

const Register = ({ setAlert, setLoading, loading }) => {
    const { control, handleSubmit } = useForm({
        defaultValues: { first_name: '', last_name: '', email: '' }
    });
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            // Mock API call
            const res = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.detail || 'Registration failed');
            }

            setAlert({ open: true, message: 'Registration successful! Please check your email for the password link.', type: 'success' });
            // Keep them on page to see success message
        } catch (err) {
            setAlert({ open: true, message: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create an account"
            subtitle="Join to manage tickets and projects seamlessly."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <CustomInput
                        name="first_name"
                        control={control}
                        label="First Name"
                        rules={{ required: 'First name is required' }}
                    />
                    <CustomInput
                        name="last_name"
                        control={control}
                        label="Last Name"
                        rules={{ required: 'Last name is required' }}
                    />
                </div>

                <CustomInput
                    name="email"
                    type="email"
                    control={control}
                    label="Email Address"
                    rules={{
                        required: 'Email is required',
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                        }
                    }}
                />

                <div className="my-4">
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={loading}
                        className="h-12 text-base font-semibold shadow-md "
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                    </Button>
                </div>

                <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
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

export default connect(mapStateToProps, mapDispatchToProps)(Register);
