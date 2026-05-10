import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useTranslation } from '../hooks/useTranslation';
import { formatLabel } from '../utils/formatText';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { databaseService } from '../services/databaseService';
import { Order, OrderItem } from '../types';
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck,
  Smartphone,
  Building2,
  Wallet,
  AlertCircle,
  Archive
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '../components/checkout/StripePaymentForm';

const stripePublishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || (process as any).env.VITE_STRIPE_PUBLISHABLE_KEY || '';
if (!stripePublishableKey) {
  console.warn('VITE_STRIPE_PUBLISHABLE_KEY is missing from environment variables.');
}
const stripePromise = loadStripe(stripePublishableKey);

interface ShippingMethod {
  id: 'hp_shipping' | 'gls_express' | 'boxnow_locker' | 'pickup' | 'courier';
  name: string;
  price: number;
  description: string;
  icon: React.ReactNode;
}

interface PaymentMethod {
  id: 'stripe' | 'cod' | 'bank_transfer' | 'keks_pay';
  name: string;
  icon: React.ReactNode;
  description: string;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'hp_shipping',
    name: 'hp_shipping',
    price: 4.50,
    description: 'hp_shipping_desc',
    icon: <Truck className="text-blue-600" size={20} />
  },
  {
    id: 'gls_express',
    name: 'gls_express',
    price: 6.90,
    description: 'gls_express_desc',
    icon: <Truck className="text-yellow-500" size={20} />
  },
  {
    id: 'boxnow_locker',
    name: 'boxnow_locker',
    price: 2.50,
    description: 'boxnow_locker_desc',
    icon: <Archive size={20} className="text-green-500" />
  },
  {
    id: 'pickup',
    name: 'store_pickup',
    price: 0.00,
    description: 'store_pickup_desc',
    icon: <Building2 className="text-zinc-400" size={20} />
  }
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCartStore();
  const { user, isAuthenticated, refreshProfile } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();

  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(location.state?.appliedCoupon || null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  useEffect(() => {
    if (appliedCoupon) {
      databaseService.validateCoupon(appliedCoupon.code, cartItems).then(res => {
        if (res.valid) {
          setPromoDiscount(res.discount);
        } else {
          setPromoDiscount(0);
          setAppliedCoupon(null);
        }
      });
    }
  }, [appliedCoupon, cartItems]);
  
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated, refreshProfile]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLogos, setPaymentLogos] = useState<{ [key: string]: string }>({});

  const PAYMENT_METHODS: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'credit_card',
      description: 'credit_card_desc',
      icon: <div className="flex gap-1">
        {paymentLogos.visa ? (
          <img src={paymentLogos.visa} alt="Visa" className="h-3 grayscale opacity-50" referrerPolicy="no-referrer" />
        ) : (
          <span className="text-[8px] font-bold text-zinc-500">VISA</span>
        )}
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" className="h-4 grayscale opacity-50" referrerPolicy="no-referrer" />
      </div>
    },
    {
      id: 'keks_pay',
      name: 'keks_pay',
      description: 'keks_pay_desc',
      icon: <Smartphone className="text-red-500" size={20} />
    },
    {
      id: 'cod',
      name: 'cash_on_delivery',
      description: 'cash_on_delivery_desc',
      icon: <Wallet className="text-emerald-500" size={20} />
    },
    {
      id: 'bank_transfer',
      name: 'bank_transfer',
      description: 'bank_transfer_desc',
      icon: <Building2 className="text-blue-400" size={20} />
    }
  ];

  const [selectedShipping, setSelectedShipping] = useState(SHIPPING_METHODS[0]);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0]);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkAllStock = async () => {
      if (cartItems.length === 0) return;
      const items = cartItems.map(item => ({ productId: item.productId, quantity: item.quantity }));
      const stockStatus = await databaseService.checkStock(items);
      const newErrors: Record<string, string> = {};
      stockStatus.forEach((s: any) => {
        if (!s.sufficient) {
          newErrors[s.productId] = `Only ${s.available} in stock`;
        }
      });
      setStockErrors(newErrors);
    };
    checkAllStock();
  }, [cartItems]);
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.username?.split(' ')[0] || '',
    lastName: user?.username?.split(' ')[1] || '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'firstName':
        if (!value?.trim()) {
          error = t('first_name_required');
        } else if (value.length < 2) {
          error = t('first_name_min');
        } else if (value.length > 50) {
          error = t('first_name_max');
        }
        break;
      case 'lastName':
        if (!value?.trim()) {
          error = t('last_name_required');
        } else if (value.length < 2) {
          error = t('last_name_min');
        } else if (value.length > 50) {
          error = t('last_name_max');
        }
        break;
      case 'email':
        if (!value?.trim()) {
          error = t('email_required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = t('invalid_email');
        } else if (value.length > 255) {
          error = t('email_max_chars');
        }
        break;
      case 'address':
        if (!value?.trim()) {
          error = t('address_required');
        } else if (value.length < 5) {
          error = t('address_min');
        } else if (value.length > 200) {
          error = t('address_max');
        }
        break;
      case 'city':
        if (!value?.trim()) {
          error = t('city_required');
        } else if (value.length < 2) {
          error = t('city_min');
        } else if (value.length > 100) {
          error = t('city_max');
        }
        break;
      case 'postalCode':
        if (!value?.trim()) {
          error = t('postal_code_required');
        } else if (!/^[0-9]{4,10}$/.test(value.replace(/\s/g, ''))) {
          error = t('postal_code_invalid');
        }
        break;
      case 'phone':
        if (!value?.trim()) {
          error = t('phone_required');
        } else if (!/^[0-9+\-\s()]{7,20}$/.test(value)) {
          error = t('phone_invalid');
        }
        break;
    }
    return error;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const [applePay, maestro, visa, google] = await Promise.all([
          databaseService.getFileURL('site/2d/5968630.png'),
          databaseService.getFileURL('site/2d/Maestro_logo.png'),
          databaseService.getFileURL('site/2d/Visa-Brandmark-Blue-RGB-800x800-16353.png'),
          databaseService.getFileURL('site/2d/Google__G__logo.svg.png')
        ]);
        setPaymentLogos({ applePay, maestro, visa, google });
      } catch (err) {
        console.error('Error fetching payment logos:', err);
      }
    };
    fetchLogos();
  }, []);

  const userDiscount = Number(user?.discountLevel || 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);
  const discountAmount = subtotal * (userDiscount / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const total = Math.max(0, discountedSubtotal - (Number(promoDiscount) || 0)) + (Number(selectedShipping.price) || 0);
  const vatAmount = total * 0.2;

  useEffect(() => {
    if (step === 2 && selectedPayment.id === 'stripe' && !stripeClientSecret) {
      const initStripe = async () => {
        try {
          // 1. Create a "pending" order first if it doesn't exist
          let orderId = currentOrderId;
          if (!orderId) {
            const orderItems: OrderItem[] = cartItems.map(item => ({
              productId: item.productId,
              name: item.productName,
              price: Number(item.price),
              quantity: Number(item.quantity),
              image: item.image,
              sku: item.sku,
              category: item.category,
              landingCost: Number(item.landingCost || (item.price * 0.6))
            }));

            const orderData = {
              userId: isAuthenticated ? user!.id : 'guest',
              items: orderItems,
              subtotal: Number(discountedSubtotal),
              tax: Number(vatAmount),
              discountAmount: Number(discountAmount),
              shipping_cost: Number(selectedShipping.price),
              total: Number(total),
              profit: Number(total - orderItems.reduce((acc, i) => acc + (i.landingCost || 0) * i.quantity, 0) - selectedShipping.price),
              couponId: appliedCoupon?.id,
              couponCode: appliedCoupon?.code,
              promoDiscount: Number(promoDiscount),
              status: 'awaiting_payment',
              payment: {
                method: 'stripe',
                status: 'pending',
                amount: Number(total),
                currency: 'EUR',
                paidAt: null
              },
              shipping: {
                method: selectedShipping.id,
                firstName: formData.firstName,
                lastName: formData.lastName,
                fullName: `${formData.firstName} ${formData.lastName}`,
                phone: formData.phone,
                email: formData.email,
                city: formData.city,
                address: formData.address,
                postalCode: formData.postalCode,
                status: 'pending',
                cost: Number(selectedShipping.price)
              }
            };

            const response = await databaseService.createOrder(orderData);
            orderId = response.id;
            setCurrentOrderId(orderId);
          }

          // 2. Create Payment Intent linked to this order
          const { clientSecret } = await databaseService.createPaymentIntent(cartItems, selectedShipping.price, orderId || undefined, discountedSubtotal);
          setStripeClientSecret(clientSecret);
        } catch (err: any) {
          console.error('Stripe Init Error:', err);
          setError(t('stripe_init_error'));
        }
      };
      initStripe();
    }
  }, [step, selectedPayment, total, stripeClientSecret, currentOrderId]);

  const handleNext = () => {
    setError(null);
    setStep(s => s + 1);
  };
  const handleBack = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent, isStripePaid: boolean = false) => {
    if (e) e.preventDefault();
    
    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) errors[key] = error;
    });
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const errorFields = Object.keys(errors).join(', ');
      setError(t('validation_error_fix', { fields: errorFields }));
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const orderItems: OrderItem[] = cartItems.map(item => ({
        productId: item.productId,
        name: item.productName,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image,
        sku: item.sku,
        category: item.category,
        landingCost: Number(item.landingCost || (item.price * 0.6)), // Fallback for demo
        selectedVariant: item.selectedVariant ? {
          id: item.selectedVariant.id,
          name: item.selectedVariant.name,
          attributes: item.selectedVariant.attributes
        } : undefined
      }));

      let orderStatus: Order['status'] = 'pending';
      let paymentStatus: Order['payment']['status'] = 'pending';

      if (isStripePaid) {
        orderStatus = 'paid';
        paymentStatus = 'paid';
      } else if (selectedPayment.id === 'bank_transfer') {
        orderStatus = 'awaiting_payment';
        paymentStatus = 'pending';
      } else if (selectedPayment.id === 'cod') {
        orderStatus = 'pending';
        paymentStatus = 'pending';
      }

      const orderData: Omit<Order, 'orderNumber' | 'createdAt' | 'updatedAt' | 'auditTrail'> & { id?: string } = {
        id: currentOrderId || undefined,
        userId: isAuthenticated ? user!.id : 'guest',
        items: orderItems,
        subtotal: Number(discountedSubtotal),
        tax: Number(vatAmount),
        discountAmount: Number(discountAmount),
        shipping_cost: Number(selectedShipping.price),
        total: Number(total),
        profit: Number(total - orderItems.reduce((acc, i) => acc + (i.landingCost || 0) * i.quantity, 0) - selectedShipping.price),
        couponId: appliedCoupon?.id,
        couponCode: appliedCoupon?.code,
        promoDiscount: Number(promoDiscount),
        status: orderStatus,
        payment: {
          method: selectedPayment.id,
          status: paymentStatus,
          amount: Number(total),
          currency: 'EUR',
          paidAt: paymentStatus === 'paid' ? new Date().toISOString() : null
        },
        shipping: {
          method: selectedShipping.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          fullName: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          address: formData.address,
          postalCode: formData.postalCode,
          status: 'pending',
          cost: Number(selectedShipping.price)
        }
      };

      await databaseService.createOrder(orderData);
      
      setIsProcessing(false);
      setStep(4); // Success step
      clearCart();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || t('order_place_error'));
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0 && step !== 4) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold text-white mb-4">{t('cart_empty')}</h2>
        <Link to="/shop" className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest">
          {t('go_to_shop')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-24 transition-colors duration-300">
      {/* Header */}
      <header className="h-16 sm:h-20 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={() => navigate('/cart')} className="p-1.5 sm:p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">{t('checkout')}</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-1 sm:h-1.5 w-4 sm:w-8 rounded-full transition-all ${step >= i ? 'bg-[#ab1017]' : 'bg-[var(--bg-tertiary)]'}`} 
            />
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <section className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-[var(--text-primary)]">
                      <MapPin className="text-[#ab1017] sm:w-6 sm:h-6" size={20} />
                      {t('shipping_info')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('first_name')}</label>
                        <input 
                          type="text" 
                          required
                          value={formData.firstName}
                          onChange={e => handleFieldChange('firstName', e.target.value)}
                          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-[var(--bg-tertiary)] border rounded-lg sm:rounded-xl outline-none focus:border-[#ab1017] transition-all text-sm text-[var(--text-primary)] ${
                            fieldErrors.firstName ? 'border-red-500' : 'border-[var(--border-color)]'
                          }`}
                          maxLength={50}
                        />
                        {fieldErrors.firstName && (
                          <p className="text-red-500 text-xs">{fieldErrors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('last_name')}</label>
                        <input 
                          type="text" 
                          required
                          value={formData.lastName}
                          onChange={e => handleFieldChange('lastName', e.target.value)}
                          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-[var(--bg-tertiary)] border rounded-lg sm:rounded-xl outline-none focus:border-[#ab1017] transition-all text-sm text-[var(--text-primary)] ${
                            fieldErrors.lastName ? 'border-red-500' : 'border-[var(--border-color)]'
                          }`}
                          maxLength={50}
                        />
                        {fieldErrors.lastName && (
                          <p className="text-red-500 text-xs">{fieldErrors.lastName}</p>
                        )}
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                        <label className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('your_email')}</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={e => handleFieldChange('email', e.target.value)}
                          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-[var(--bg-tertiary)] border rounded-lg sm:rounded-xl outline-none focus:border-[#ab1017] transition-all text-sm text-[var(--text-primary)] ${
                            fieldErrors.email ? 'border-red-500' : 'border-[var(--border-color)]'
                          }`}
                          maxLength={255}
                        />
                        {fieldErrors.email && (
                          <p className="text-red-500 text-xs">{fieldErrors.email}</p>
                        )}
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                        <label className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('address')}</label>
                        <input 
                          type="text" 
                          required
                          value={formData.address}
                          onChange={e => handleFieldChange('address', e.target.value)}
                          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-[var(--bg-tertiary)] border rounded-lg sm:rounded-xl outline-none focus:border-[#ab1017] transition-all text-sm text-[var(--text-primary)] ${
                            fieldErrors.address ? 'border-red-500' : 'border-[var(--border-color)]'
                          }`}
                          maxLength={200}
                        />
                        {fieldErrors.address && (
                          <p className="text-red-500 text-xs">{fieldErrors.address}</p>
                        )}
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('city')}</label>
                        <input 
                          type="text" 
                          required
                          value={formData.city}
                          onChange={e => handleFieldChange('city', e.target.value)}
                          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-[var(--bg-tertiary)] border rounded-lg sm:rounded-xl outline-none focus:border-[#ab1017] transition-all text-sm text-[var(--text-primary)] ${
                            fieldErrors.city ? 'border-red-500' : 'border-[var(--border-color)]'
                          }`}
                          maxLength={100}
                        />
                        {fieldErrors.city && (
                          <p className="text-red-500 text-xs">{fieldErrors.city}</p>
                        )}
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('postal_code')}</label>
                        <input 
                          type="text" 
                          required
                          value={formData.postalCode}
                          onChange={e => handleFieldChange('postalCode', e.target.value)}
                          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-[var(--bg-tertiary)] border rounded-lg sm:rounded-xl outline-none focus:border-[#ab1017] transition-all text-sm text-[var(--text-primary)] ${
                            fieldErrors.postalCode ? 'border-red-500' : 'border-[var(--border-color)]'
                          }`}
                        />
                        {fieldErrors.postalCode && (
                          <p className="text-red-500 text-xs">{fieldErrors.postalCode}</p>
                        )}
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('phone')}</label>
                        <input 
                          type="tel" 
                          required
                          value={formData.phone}
                          onChange={e => handleFieldChange('phone', e.target.value)}
                          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-[var(--bg-tertiary)] border rounded-lg sm:rounded-xl outline-none focus:border-[#ab1017] transition-all text-sm text-[var(--text-primary)] ${
                            fieldErrors.phone ? 'border-red-500' : 'border-[var(--border-color)]'
                          }`}
                          placeholder="+385..."
                        />
                        {fieldErrors.phone && (
                          <p className="text-red-500 text-xs">{fieldErrors.phone}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-[var(--text-primary)]">
                      <Truck className="text-[#ab1017] sm:w-6 sm:h-6" size={20} />
                      {t('shipping_method')}
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {SHIPPING_METHODS.map(method => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedShipping(method)}
                          className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all text-left ${
                            selectedShipping.id === method.id 
                              ? 'bg-[#ab1017]/10 border-[#ab1017]' 
                              : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--border-color)]'
                          }`}
                        >
                          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${selectedShipping.id === method.id ? 'bg-[#ab1017] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                            {method.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                              <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base truncate pr-2">{t(method.name)}</span>
                              <span className="font-mono font-bold text-[var(--text-primary)] text-sm sm:text-base whitespace-nowrap">€{method.price.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] uppercase tracking-widest truncate opacity-60">{t(method.description)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <button 
                    onClick={handleNext}
                    className="w-full py-4 sm:py-5 bg-[#ab1017] hover:bg-[#8e0d13] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-[#ab1017]/20 text-xs sm:text-sm"
                  >
                    {t('continue_to_payment')}
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <section className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-[var(--text-primary)]">
                      <CreditCard className="text-[#ab1017] sm:w-6 sm:h-6" size={20} />
                      {t('payment_method')}
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {PAYMENT_METHODS.map(method => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPayment(method)}
                          className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all text-left ${
                            selectedPayment.id === method.id 
                              ? 'bg-[#ab1017]/10 border-[#ab1017]' 
                              : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--border-color)]'
                          }`}
                        >
                          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${selectedPayment.id === method.id ? 'bg-[#ab1017] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                            {method.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block font-bold text-[var(--text-primary)] mb-0.5 sm:mb-1 text-sm sm:text-base truncate">{t(method.name)}</span>
                            <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] uppercase tracking-widest truncate opacity-60">{t(method.description)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  {error && (
                    <div className="p-3 sm:p-4 bg-red-600/10 border border-red-600/20 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 text-red-500 text-[10px] sm:text-sm">
                      <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                      {error}
                    </div>
                  )}

                    <div className="flex gap-3 sm:gap-4">
                      <button 
                        onClick={handleBack}
                        className="flex-1 py-4 sm:py-5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all border border-[var(--border-color)] text-xs sm:text-sm"
                      >
                        {t('back')}
                      </button>
                    {selectedPayment.id === 'stripe' ? (
                      <div className="flex-[2]">
                        {stripeClientSecret ? (
                          <Elements 
                            key={stripeClientSecret}
                            stripe={stripePromise} 
                            options={{ 
                              clientSecret: stripeClientSecret,
                              appearance: { theme: 'night' }
                            }}
                          >
                            <StripePaymentForm 
                              total={total} 
                              onSuccess={async () => {
                                // For Stripe, we confirm payment then create order marked as paid
                                await handleSubmit(new Event('submit') as any, true);
                              }} 
                            />
                          </Elements>
                        ) : (
                          <div className="w-full py-4 sm:py-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#ab1017] border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={handleNext}
                        className="flex-[2] py-4 sm:py-5 bg-[#ab1017] hover:bg-[#8e0d13] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-[#ab1017]/20 text-xs sm:text-sm"
                      >
                        {t('review_order')}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <section className="p-5 sm:p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl sm:rounded-3xl space-y-5 sm:space-y-6 shadow-sm">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)]">{t('review_order')}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{t('shipping_info')}</h3>
                        <div className="text-xs sm:text-sm text-[var(--text-primary)] space-y-1">
                          <p className="font-black uppercase tracking-tighter">{formData.firstName} {formData.lastName}</p>
                          <p className="opacity-70">{formData.address}</p>
                          <p className="opacity-70">{formData.postalCode} {formData.city}</p>
                          <p className="opacity-70">{t('croatia')}</p>
                        </div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{t('shipping_method')}</h3>
                        <div className="text-xs sm:text-sm text-[var(--text-primary)] space-y-1">
                          <p className="font-black uppercase tracking-tighter">{t(selectedShipping.name)}</p>
                          <p className="font-black uppercase tracking-tighter text-[#ab1017]">{t(selectedPayment.name)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 sm:pt-6 border-t border-[var(--border-color)]">
                      <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3 sm:mb-4">{t('available_parts')}</h3>
                      <div className="space-y-3 sm:space-y-4">
                        {cartItems.map(item => (
                          <div key={item.id} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{item.productName}</span>
                              <span className="font-mono text-[var(--text-primary)] text-xs sm:text-sm whitespace-nowrap">€{item.totalPrice.toLocaleString()}</span>
                            </div>
                            {stockErrors[item.productId] && (
                              <div className="text-[#ab1017] text-[10px] font-black uppercase tracking-tight animate-pulse">
                                {stockErrors[item.productId]}
                              </div>
                            )}
                            {item.selectedVariant && (
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(item.selectedVariant.attributes).map(([key, value]) => (
                                  <span key={key} className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest font-black opacity-50">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {error && (
                    <div className="p-3 sm:p-4 bg-red-600/10 border border-red-600/20 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 text-red-500 text-[10px] sm:text-sm">
                      <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 sm:gap-4">
                    <button 
                      onClick={handleBack}
                      className="flex-1 py-4 sm:py-5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all border border-[var(--border-color)] text-xs sm:text-sm"
                    >
                      {t('back')}
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={isProcessing || Object.keys(stockErrors).length > 0}
                      className="flex-[2] py-4 sm:py-5 bg-[#ab1017] hover:bg-[#8e0d13] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-[#ab1017]/20 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {t('complete_order')}
                          <ShieldCheck size={18} className="sm:w-5 sm:h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 sm:py-24 text-center"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#ab1017]/20 rounded-full flex items-center justify-center mb-6 sm:mb-8 border border-[#ab1017]/30">
                    <CheckCircle2 size={40} className="sm:w-12 sm:h-12 text-[#ab1017]" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-4 text-[var(--text-primary)]">{t('order_confirmed')}</h2>
                  <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-8 sm:mb-12 max-w-md mx-auto px-4 font-medium">
                    {t('order_confirmed_desc').replace('{{email}}', formData.email)}
                  </p>
                  <Link 
                    to="/" 
                    className="px-10 py-4 sm:px-12 sm:py-5 bg-[#ab1017] hover:bg-[#8e0d13] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-[#ab1017]/20 text-xs sm:text-sm"
                  >
                    {t('home')}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          {step < 4 && (
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="lg:sticky lg:top-32 p-6 sm:p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl space-y-5 sm:space-y-6 shadow-2xl relative overflow-hidden group">
                {/* Decorative background gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ab1017]/5 blur-[60px] rounded-full group-hover:bg-[#ab1017]/10 transition-colors" />
                
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter text-[var(--text-primary)] relative z-10">{t('order_summary')}</h3>
                <div className="space-y-3 sm:space-y-4 relative z-10">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[var(--text-secondary)] font-bold uppercase tracking-widest">{t('total_price')}</span>
                    <span className="text-[var(--text-primary)] font-mono font-black">€{Number(subtotal).toLocaleString('hr-HR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {userDiscount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-emerald-500">
                      <span>{t('dashboard_discount')} ({formatLabel(user?.rank || '')}) -{userDiscount}%</span>
                      <span className="font-mono">-€{Number(discountAmount).toLocaleString('hr-HR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-[#ab1017] bg-[#ab1017]/5 p-2 rounded-lg border border-[#ab1017]/20">
                      <span className="font-bold uppercase tracking-widest">Promo ({appliedCoupon?.code})</span>
                      <span className="font-mono font-black">-€{Number(promoDiscount).toLocaleString('hr-HR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[var(--text-secondary)] font-bold uppercase tracking-widest">{t('shipping_method')}</span>
                    <span className="text-[var(--text-primary)] font-mono font-black">€{selectedShipping.price.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-[var(--border-color)] my-3 sm:my-4" />
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">{t('total')}</span>
                      <span className="text-3xl sm:text-4xl font-black text-[#ab1017] font-mono tracking-tighter">€{total.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.3em] opacity-50">
                      <span>{t('vat_included')}</span>
                      <span className="font-mono">€{vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 sm:pt-6 space-y-4 relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-black opacity-50">
                    <ShieldCheck size={14} className="sm:w-4 sm:h-4 text-[#ab1017]" />
                    {t('secure_ssl_encryption')}
                  </div>
                  <div className="flex flex-wrap gap-4 grayscale opacity-30">
                    {paymentLogos.visa && <img src={paymentLogos.visa} alt="Visa" className="h-2" referrerPolicy="no-referrer" />}
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" className="h-4" referrerPolicy="no-referrer" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-3" referrerPolicy="no-referrer" />
                    {paymentLogos.maestro && <img src={paymentLogos.maestro} alt="Maestro" className="h-4" referrerPolicy="no-referrer" />}
                    {paymentLogos.applePay && <img src={paymentLogos.applePay} alt="Apple Pay" className="h-4" referrerPolicy="no-referrer" />}
                    {paymentLogos.google && <img src={paymentLogos.google} alt="Google" className="h-4" referrerPolicy="no-referrer" />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
