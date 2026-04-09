import React, { useState } from 'react';
import { User, Phone, Mail, Camera, Save, Loader2, Landmark, Sprout, Shield, Key, CheckCircle2, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User as UserType } from '../types';

interface ProfileProps {
  user: UserType;
  onUpdate: (updatedUser: UserType) => void;
  language: string;
}

export default function Profile({ user, onUpdate, language }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    photoURL: user.photoURL || '',
    totalLand: user.totalLand || '5.2',
    activeCrops: user.activeCrops || 3,
    twoFactorEnabled: user.twoFactorEnabled || false
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onUpdate({
      ...user,
      name: formData.name,
      phone: formData.phone,
      photoURL: formData.photoURL,
      totalLand: formData.totalLand,
      activeCrops: formData.activeCrops,
      twoFactorEnabled: formData.twoFactorEnabled
    });
    setIsLoading(false);
    setIsEditing(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setPasswordStatus('error');
      return;
    }
    setPasswordStatus('loading');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPasswordStatus('success');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordStatus('idle');
      setPasswordData({ current: '', new: '', confirm: '' });
    }, 2000);
  };

  const toggle2FA = () => {
    const newValue = !formData.twoFactorEnabled;
    setFormData(prev => ({ ...prev, twoFactorEnabled: newValue }));
    onUpdate({ ...user, twoFactorEnabled: newValue });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="relative">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-green-50 border-4 border-white shadow-xl">
            {formData.photoURL ? (
              <img 
                src={formData.photoURL} 
                alt={user.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-green-600">
                <User className="w-16 h-16 md:w-20 md:h-20" />
              </div>
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-2 right-2 p-3 bg-green-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-green-700 transition-all">
              <Camera className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{user.name}</h2>
          <p className="text-gray-500 font-medium flex items-center justify-center md:justify-start gap-2">
            <Mail className="w-4 h-4" />
            {user.email}
          </p>
          <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold">Premium Farmer</span>
            <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">Verified Account</span>
          </div>
        </div>

        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${
            isEditing ? 'bg-gray-100 text-gray-600' : 'bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700'
          }`}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              Account Information
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 ml-1 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text"
                      disabled={!isEditing}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 ml-1 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="tel"
                      disabled={!isEditing}
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all disabled:opacity-60"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-gray-500 ml-1 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 outline-none opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 ml-1 italic">Email cannot be changed for security reasons.</p>
                </div>
              </div>

              {isEditing && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Changes
                </motion.button>
              )}
            </form>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              Security Settings
            </h3>
            <div className="space-y-4">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full text-left p-6 rounded-3xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-100 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-green-600 shadow-sm transition-colors">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Change Password</p>
                    <p className="text-xs text-gray-500">Update your account password regularly</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-600 transition-all" />
              </button>

              <div className="w-full p-6 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Add an extra layer of security</p>
                  </div>
                </div>
                <button 
                  onClick={toggle2FA}
                  className={`w-14 h-8 rounded-full relative transition-all ${formData.twoFactorEnabled ? 'bg-green-600' : 'bg-gray-200'}`}
                >
                  <motion.div 
                    animate={{ x: formData.twoFactorEnabled ? 24 : 4 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-green-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-green-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Landmark className="w-6 h-6" />
                Farm Statistics
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Land (Acres)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      step="0.1"
                      disabled={!isEditing}
                      value={formData.totalLand}
                      onChange={e => setFormData({...formData, totalLand: e.target.value})}
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 w-24 font-bold text-lg outline-none focus:bg-white/20 transition-all disabled:bg-transparent disabled:border-transparent disabled:px-0"
                    />
                    <span className="font-medium opacity-80">Acres</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Active Crops</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      disabled={!isEditing}
                      value={formData.activeCrops}
                      onChange={e => setFormData({...formData, activeCrops: parseInt(e.target.value) || 0})}
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 w-24 font-bold text-lg outline-none focus:bg-white/20 transition-all disabled:bg-transparent disabled:border-transparent disabled:px-0"
                    />
                    <span className="font-medium opacity-80">Crops</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Join Date</p>
                  <p className="font-bold text-lg">January 2024</p>
                </div>
              </div>
            </div>
            <Sprout className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 rotate-12" />
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-900">Email Verified</p>
                  <p className="text-[10px] text-green-700">Verified on Jan 12, 2024</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Identity Verified</p>
                  <p className="text-[10px] text-blue-700">KYC Level 2 Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !passwordStatus.includes('loading') && setShowPasswordModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Change Password</h3>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {passwordStatus === 'success' ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Password Updated!</h4>
                  <p className="text-gray-500">Your security is our priority.</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1 uppercase tracking-wider">Current Password</label>
                    <input 
                      type="password"
                      required
                      value={passwordData.current}
                      onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1 uppercase tracking-wider">New Password</label>
                    <input 
                      type="password"
                      required
                      value={passwordData.new}
                      onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1 uppercase tracking-wider">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      value={passwordData.confirm}
                      onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                      className={`w-full px-6 py-4 rounded-2xl border ${passwordStatus === 'error' ? 'border-red-500 ring-4 ring-red-500/10' : 'border-gray-100'} bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all`}
                    />
                    {passwordStatus === 'error' && <p className="text-xs text-red-500 ml-1 font-bold">Passwords do not match</p>}
                  </div>

                  <button 
                    type="submit"
                    disabled={passwordStatus === 'loading'}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    {passwordStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Update Password
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
