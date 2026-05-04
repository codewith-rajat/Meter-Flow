import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Loader } from 'lucide-react';
import api from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ invoiceId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const { data } = await api.post('/payments/create-payment-intent', {
        amount,
        currency: 'USD',
        invoiceId
      });

      const clientSecret = data.data.clientSecret;

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: 'Customer' }
        }
      });

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Mark invoice as paid
        await api.post('/payments/confirm', {
          paymentIntentId: paymentIntent.id,
          invoiceId
        });
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader size={18} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard size={18} />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
};

export const PaymentModal = ({ invoiceId, amount, isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600">Amount to Pay</p>
          <p className="text-3xl font-bold text-gray-900">${amount.toFixed(2)}</p>
        </div>

        <Elements stripe={stripePromise}>
          <PaymentForm
            invoiceId={invoiceId}
            amount={amount}
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
          />
        </Elements>

        <button
          onClick={onClose}
          className="w-full mt-4 text-gray-600 hover:text-gray-900 font-semibold py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PaymentForm;
