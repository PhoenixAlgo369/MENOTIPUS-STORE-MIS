import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PinSetupPage = () => {
  const { user, setPin: setPinInContext, isAuthenticated } = useAuth();
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // If user already has PIN set, redirect to dashboard
    if (user?.pinSet) {
      navigate('/');
      return;
    }
    
    // If user is a demo user (admin or cashier), redirect to dashboard
    if (user?.username === 'admin' || user?.username === 'cashier') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!pin) {
      newErrors.pin = 'PIN is required';
    } else if (pin.length !== 4) {
      newErrors.pin = 'PIN must be 4 digits';
    } else if (!/^\d+$/.test(pin)) {
      newErrors.pin = 'PIN must contain only numbers';
    }

    if (!confirmPin) {
      newErrors.confirmPin = 'Please confirm your PIN';
    } else if (pin !== confirmPin) {
      newErrors.confirmPin = 'PINs do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await setPinInContext(user.id, pin);

      if (result.success) {
        alert('PIN set successfully!');
        navigate('/'); // Redirect to dashboard
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('PIN setup error:', error);
      alert('An error occurred while setting your PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-600 dark:bg-blue-700 rounded-xl flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Set Your PIN</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create a 4-digit PIN for secure access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Create PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="pin"
                  name="pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:outline-none transition ${
                    errors.pin 
                      ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-800' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800 dark:border-gray-600'
                  } dark:bg-gray-700 dark:text-white`}
                  placeholder="••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.pin && (
                <p className="mt-1 text-sm text-red-600">{errors.pin}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPin"
                  name="confirmPin"
                  type={showConfirmPin ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:outline-none transition ${
                    errors.confirmPin 
                      ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-800' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800 dark:border-gray-600'
                  } dark:bg-gray-700 dark:text-white`}
                  placeholder="••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                >
                  {showConfirmPin ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPin && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPin}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting PIN...' : 'Set PIN'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your PIN will be required for sensitive operations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinSetupPage;