import React from 'react';
import { auth } from '../../auth';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { Phone, Check, RefreshCw, ArrowRight } from 'lucide-react';

export const PhoneAuth: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [verificationId, setVerificationId] = React.useState<ConfirmationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [timer, setTimer] = React.useState(0);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const recaptchaRef = React.useRef<HTMLDivElement>(null);

  const validateField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'phoneNumber':
        if (!value?.trim()) {
          error = 'Phone number is required';
        } else if (!/^\+[0-9]{7,15}$/.test(value)) {
          error = 'Please enter a valid phone number with country code (e.g. +385123456789)';
        }
        break;
      case 'otp':
        if (!value?.trim()) {
          error = 'Verification code is required';
        } else if (!/^[0-9]{6}$/.test(value)) {
          error = 'Verification code must be 6 digits';
        }
        break;
    }
    return error;
  };

  const handleFieldChange = (field: string, value: any) => {
    if (field === 'phoneNumber') setPhoneNumber(value);
    else if (field === 'otp') setOtp(value);
    
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  React.useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    const phoneError = validateField('phoneNumber', phoneNumber);
    if (phoneError) {
      setFieldErrors({ phoneNumber: phoneError });
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setVerificationId(result);
      setTimer(60);
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
      if (err.code === 'auth/captcha-check-failed') {
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationId) return;
    
    // Validate OTP
    const otpError = validateField('otp', otp);
    if (otpError) {
      setFieldErrors({ otp: otpError });
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      await verificationId.confirm(otp);
      // Auth state will be handled by onAuthStateChanged in authStore
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div id="recaptcha-container"></div>
      
      {!verificationId ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                placeholder="+1 234 567 8900"
                className={`w-full bg-zinc-900 border rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-red-600 transition-colors ${
                  fieldErrors.phoneNumber ? 'border-red-500' : 'border-zinc-800'
                }`}
                required
              />
            </div>
            {fieldErrors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.phoneNumber}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Verification Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => handleFieldChange('otp', e.target.value)}
              placeholder="123456"
              maxLength={6}
              className={`w-full bg-zinc-900 border rounded-lg py-2.5 px-4 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-red-600 transition-colors ${
                fieldErrors.otp ? 'border-red-500' : 'border-zinc-800'
              }`}
              required
            />
            {fieldErrors.otp && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.otp}</p>
            )}
          </div>
          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => setVerificationId(null)}
              className="text-zinc-500 hover:text-white"
            >
              Change Number
            </button>
            {timer > 0 ? (
              <span className="text-zinc-500">Resend in {timer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleSendCode}
                className="text-red-500 hover:text-red-400 font-bold"
              >
                Resend Code
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : (
              <>
                Verify & Login
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}
      
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
    </div>
  );
};
