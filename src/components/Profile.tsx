import React, { useState } from 'react';
import { User, Phone, Mail, Camera, Save, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { User as UserType } from '../types';

interface ProfileProps {
  user: UserType;
  onUpdate: (updatedUser: UserType) => void;
  language: string;
}

export default function Profile({ user, onUpdate, language }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    photoURL: user.photoURL || ''
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
      photoURL: formData.photoURL
    });
    setIsLoading(false);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
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

        <div className="space-y-8">
          <div className="bg-green-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-green-100">
            <h3 className="text-xl font-bold mb-4">Farm Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="opacity-80">Total Land</span>
                <span className="font-bold text-lg">5.2 Acres</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="opacity-80">Active Crops</span>
                <span className="font-bold text-lg">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-80">Join Date</span>
                <span className="font-bold text-lg">Jan 2024</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Security</h3>
            <button className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-between group">
              <span className="font-bold text-gray-700">Change Password</span>
              <Camera className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-all" />
            </button>
            <button className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-between group mt-2">
              <span className="font-bold text-gray-700">Two-Factor Auth</span>
              <div className="w-10 h-6 bg-gray-200 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
