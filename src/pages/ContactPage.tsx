import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  MessageSquare, 
  ShieldCheck,
  Globe,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { databaseService } from '../services/databaseService';

export const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: t('product_question'),
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const validateField = (field: string, value: string) => {
    let error = '';
    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = t('name_required');
        } else if (value.length < 2) {
          error = t('name_min_chars');
        } else if (value.length > 100) {
          error = t('name_max_chars');
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = t('letters_only');
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = t('email_required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = t('invalid_email');
        } else if (value.length > 255) {
          error = t('email_max_chars');
        }
        break;
      case 'subject':
        if (!value.trim()) {
          error = t('subject_required');
        } else if (value.length > 200) {
          error = t('subject_max_chars');
        }
        break;
      case 'message':
        if (!value.trim()) {
          error = t('message_required');
        } else if (value.length < 10) {
          error = t('message_min_chars');
        } else if (value.length > 2000) {
          error = t('message_max_chars');
        }
        break;
    }
    return error;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // Validate all fields
    const errors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      subject: validateField('subject', formData.subject),
      message: validateField('message', formData.message)
    };

    setFieldErrors(errors);

    // Check if any errors exist
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      setStatus('idle');
      return;
    }

    try {
      await databaseService.sendContactMessage(formData);
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: t('product_question'),
        message: ''
      });
      setFieldErrors({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setErrorMessage(t('network_error'));
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] flex items-center justify-center overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-zinc-900/40 to-zinc-950 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)]" />
        <div className="relative z-20 text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white"
          >
            {t('contact').toUpperCase()} <span className="text-red-600">&</span> {t('contact_support').toUpperCase()}
          </motion.h1>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
            {t('contact_hero_desc')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-20 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6 hover:border-red-600/30 transition-all">
              <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-white font-black uppercase text-sm tracking-widest mb-2">{t('store_location')}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Ulica grada Chicaga 31<br />
                  10 000 Zagreb, Hrvatska
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6 hover:border-red-600/30 transition-all">
              <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="text-white font-black uppercase text-sm tracking-widest mb-2">{t('contact_info')}</h3>
                <div className="space-y-1 text-zinc-400 text-sm">
                  <p>Tel: 01 613 1713</p>
                  <p>Mob: 095 613 1713</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6 hover:border-red-600/30 transition-all">
              <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-white font-black uppercase text-sm tracking-widest mb-2">{t('email_address')}</h3>
                <p className="text-red-500 font-bold text-sm">order@hristo.hr</p>
                <p className="text-zinc-500 text-[10px] uppercase font-bold mt-1 tracking-widest">{t('reply_within_24h')}</p>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6 hover:border-red-600/30 transition-all">
              <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-white font-black uppercase text-sm tracking-widest mb-2">{t('working_hours')}</h3>
                <div className="space-y-1 text-zinc-400 text-sm">
                  <p>{t('mon_fri')}: {t('mon_fri_hours')}</p>
                  <p>{t('sat')}: {t('sat_hours')}</p>
                  <p>{t('sun')}: {t('closed')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/50 border border-zinc-800 p-10 md:p-16 rounded-[40px] shadow-2xl h-full">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-green-600/20 text-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{t('message_sent')}</h2>
                      <p className="text-zinc-400">{t('message_sent_desc')}</p>
                    </div>
                    <button 
                      onClick={() => setStatus('idle')}
                      className="px-8 py-3 bg-zinc-800 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-all"
                    >
                      {t('send_new_message')}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-xl space-y-12"
                  >
                    <div className="space-y-4">
                      <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{t('send_message')}</h2>
                      <p className="text-zinc-400 font-medium">{t('contact_form_desc')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('your_name')}</label>
                          <input 
                            type="text" 
                            placeholder={t('your_name_placeholder')}
                            value={formData.name}
                            onChange={e => handleFieldChange('name', e.target.value)}
                            className={`w-full px-6 py-4 bg-zinc-950 border rounded-2xl text-white placeholder:text-zinc-700 outline-none focus:border-red-600 transition-all ${
                              fieldErrors.name ? 'border-red-500' : 'border-zinc-800'
                            }`}
                            maxLength={100}
                          />
                          {fieldErrors.name && (
                            <p className="text-red-500 text-xs ml-4">{fieldErrors.name}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('your_email')}</label>
                          <input 
                            type="email" 
                            placeholder={t('your_email_placeholder')}
                            value={formData.email}
                            onChange={e => handleFieldChange('email', e.target.value)}
                            className={`w-full px-6 py-4 bg-zinc-950 border rounded-2xl text-white placeholder:text-zinc-700 outline-none focus:border-red-600 transition-all ${
                              fieldErrors.email ? 'border-red-500' : 'border-zinc-800'
                            }`}
                            maxLength={255}
                          />
                          {fieldErrors.email && (
                            <p className="text-red-500 text-xs ml-4">{fieldErrors.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('subject')}</label>
                        <select 
                          value={formData.subject}
                          onChange={e => handleFieldChange('subject', e.target.value)}
                          className={`w-full px-6 py-4 bg-zinc-950 border rounded-2xl text-white outline-none focus:border-red-600 transition-all appearance-none cursor-pointer ${
                            fieldErrors.subject ? 'border-red-500' : 'border-zinc-800'
                          }`}
                        >
                          <option>{t('product_question')}</option>
                          <option>{t('order_status')}</option>
                          <option>{t('technical_support')}</option>
                          <option>{t('complaint')}</option>
                          <option>{t('other')}</option>
                        </select>
                        {fieldErrors.subject && (
                          <p className="text-red-500 text-xs ml-4">{fieldErrors.subject}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{t('your_message')}</label>
                        <textarea 
                          placeholder={t('how_can_we_help') || 'How can we help you?'}
                          rows={6}
                          value={formData.message}
                          onChange={e => handleFieldChange('message', e.target.value)}
                          className={`w-full px-6 py-4 bg-zinc-950 border rounded-2xl text-white placeholder:text-zinc-700 outline-none focus:border-red-600 transition-all resize-none ${
                            fieldErrors.message ? 'border-red-500' : 'border-zinc-800'
                          }`}
                          maxLength={2000}
                        />
                        {fieldErrors.message && (
                          <p className="text-red-500 text-xs ml-4">{fieldErrors.message}</p>
                        )}
                      </div>

                      {status === 'error' && (
                        <div className="flex items-center gap-3 p-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500 text-sm">
                          <AlertCircle size={20} />
                          {errorMessage}
                        </div>
                      )}

                      <button 
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {status === 'loading' ? t('sending') : t('send_message')}
                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-zinc-800">
                      <div className="flex items-center gap-3 text-zinc-500">
                        <ShieldCheck size={20} className="text-red-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('secure_communication')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-500">
                        <Globe size={20} className="text-red-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('global_delivery')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-500">
                        <MessageSquare size={20} className="text-red-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('fast_responses')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-20">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[40px] overflow-hidden shadow-2xl h-[500px] relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2782.523091942485!2d16.015694776856526!3d45.78077591225028!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4766795499999999%3A0x9999999999999999!2sUl.%20grada%20Chicaga%2031%2C%2010000%2C%20Zagreb!5e0!3m2!1shr!2shr!4v1710000000000!5m2!1shr!2shr" 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="absolute top-8 left-8 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-6 rounded-3xl shadow-2xl max-w-xs">
              <h3 className="text-white font-black uppercase text-sm tracking-widest mb-2">Hristo d.o.o.</h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                Ulica grada Chicaga 31<br />
                10 000 Zagreb, Hrvatska
              </p>
              <a 
                href="https://www.google.com/maps/dir//Ul.+grada+Chicaga+31,+10000,+Zagreb" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-red-600 font-bold uppercase tracking-widest text-[10px] hover:text-red-500 transition-colors"
              >
                {t('directions')}
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
