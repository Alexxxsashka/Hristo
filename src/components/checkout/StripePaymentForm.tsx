import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useTranslation } from '../../hooks/useTranslation';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface StripePaymentFormProps {
  onSuccess: () => Promise<void> | void;
  total: number;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ onSuccess, total }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL is not strictly needed for PaymentIntent confirm if we handle it here
        // but Stripe requires it for some payment methods
        return_url: `${window.location.origin}/checkout?payment_success=true`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    } else {
      try {
        await onSuccess();
      } catch (err: any) {
        setErrorMessage(err.message || 'Payment confirmed but failed to finalize order. Please contact support.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
        <PaymentElement options={{
          layout: 'accordion',
        }} />
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      <button
        disabled={!stripe || isProcessing}
        className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Pay €{total.toFixed(2)}
            <ShieldCheck size={20} />
          </>
        )}
      </button>

      <p className="text-[10px] text-center text-zinc-500 uppercase tracking-widest font-bold">
        Payments are secured by Stripe. No card info is stored on our servers.
      </p>
    </form>
  );
};

// Fixed t() usage
