"use client";

import FDRProfileDropdown from '@/components/front-desk-role/fdr-profile-dropdown';
import FdrSidebar from '@/components/front-desk-role/fdr-sidebar';
import { FDRThemeToggle } from '@/components/front-desk-role/fdr-theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from '@/components/ui/file-upload';
import { GooeyInput } from '@/components/ui/gooey-input';
import {
  ArrowLeft,
  Building,
  Calendar,
  Camera,
  Mail,
  MapPin,
  User,
  X
} from "lucide-react";
import { getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const ProfileSettings = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good Morning");
  const [userName, setUserName] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Profile state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    employeeId: '',
    department: '',
    joinDate: '',
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      setGreeting(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening");
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (session?.user?.name) setUserName(session.user.name);
  }, [session]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
          " • " +
          now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Load user data when session is available
  useEffect(() => {
    async function fetchProfile() {
      if (session?.user) {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const data = await response.json();
            // Parse name into first and last name
            const nameParts = session.user.name?.split(' ') || ['', ''];
            setFormData(prev => ({
              ...prev,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: session.user.email || '',
              phone: data.phone || '',
              address: data.address || '',
              city: data.city || '',
              state: data.state || '',
              zipCode: data.zipCode || '',
              employeeId: 'FDR-001',
              department: 'Front Desk',
              joinDate: '2024-01-15',
            }));
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          // Set default values on error
          const nameParts = session.user.name?.split(' ') || ['', ''];
          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: session.user.email || '',
            employeeId: 'FDR-001',
            department: 'Front Desk',
            joinDate: '2024-01-15',
          }));
        }
      }
    }
    fetchProfile();
  }, [session]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      // Refresh session to reflect name changes
      await getSession();

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleImageUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFiles[0]);

      const response = await fetch('/api/user/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      setProfileImage(data.image);
      setShowImageUpload(false);
      setUploadedFiles([]);
      setSuccess(true);

      // Refresh session to reflect image changes
      await getSession();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const response = await fetch('/api/user/image', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove image');
      }

      setProfileImage(null);
      setSuccess(true);

      // Refresh session to reflect image changes
      await getSession();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to remove image. Please try again.');
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden font-saprona bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FdrSidebar />

      {/* ── Main area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden shrink-0">
        {/* Top bar */}
        <header className="h-20 shrink-0 flex items-center justify-between px-6 gap-4 border-b border-neutral-200 dark:border-[#1a1a1a] bg-white dark:bg-black">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </button>
            <GooeyInput placeholder="Search..." />
          </div>
          <div className="flex items-center gap-3">
            <FDRThemeToggle />
            <FDRProfileDropdown />
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* ── Page heading ── */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Profile Settings</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage your personal information and preferences</p>
          </div>

          {/* Success/Error messages */}
          {success && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 text-sm">
              Profile updated successfully!
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Profile card ── */}
          <div className="bg-neutral-50 dark:bg-[#0b0c0d] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-[#2a2a2a] flex items-center justify-center text-2xl font-bold text-neutral-500 dark:text-neutral-300 overflow-hidden">
                    {session?.user?.image || profileImage ? (
                      <img
                        src={session?.user?.image || profileImage || ''}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(`${formData.firstName} ${formData.lastName}`)
                    )}
                  </div>
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#668e2b] flex items-center justify-center text-black hover:bg-[#7a9f3a] transition-colors"
                    title="Change photo"
                  >
                    <Camera size={14} />
                  </button>
                </div>
                {(session?.user?.image || profileImage) && (
                  <button
                    onClick={handleRemoveImage}
                    className="mt-3 w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {/* Basic info */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Front Desk Role</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-neutral-500 dark:text-neutral-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">{formData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building size={16} className="text-neutral-500 dark:text-neutral-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">{formData.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-neutral-500 dark:text-neutral-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Joined {formData.joinDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-neutral-500 dark:text-neutral-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">{formData.employeeId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Form sections ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-neutral-50 dark:bg-[#0b0c0d] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <User size={18} className="text-[#668e2b]" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Personal Information</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#668e2b] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#668e2b] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-400 dark:text-neutral-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#668e2b] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-neutral-50 dark:bg-[#0b0c0d] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin size={18} className="text-[#668e2b]" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Address Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#668e2b] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#668e2b] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#668e2b] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="12345"
                    className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#668e2b] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="bg-neutral-50 dark:bg-[#0b0c0d] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building size={18} className="text-[#668e2b]" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Work Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-400 dark:text-neutral-500 focus:outline-none transition-colors"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-400 dark:text-neutral-500 focus:outline-none transition-colors"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-500 mb-1.5">Join Date</label>
                  <input
                    type="text"
                    name="joinDate"
                    value={formData.joinDate}
                    onChange={handleChange}
                    className="w-full bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-neutral-400 dark:text-neutral-500 focus:outline-none transition-colors"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-xl border border-neutral-200 dark:border-[#242424] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-300 dark:hover:border-[#2a2a2a] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#668e2b] text-black font-bold text-sm hover:bg-[#7a9f3a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </main>
      </div>

      {/* Image Upload Dialog */}
      <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
        <DialogContent className="bg-white dark:bg-[#111] border-neutral-200 dark:border-[#1a1a1a] text-neutral-900 dark:text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Upload Profile Photo</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Choose a new profile picture. Max file size: 5MB. Accepted formats: JPEG, PNG, GIF, WebP.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="w-full max-w-md mx-auto min-h-64 border border-dashed bg-white dark:bg-[#0d0d0d] border-neutral-200 dark:border-[#1f1f1f] rounded-lg">
              <FileUpload onChange={handleFileUpload} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowImageUpload(false);
                setUploadedFiles([]);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 dark:bg-[#1a1a1a] hover:bg-neutral-200 dark:hover:bg-[#222] border border-neutral-200 dark:border-[#242424] rounded-lg px-4 py-3 transition-colors text-neutral-700 dark:text-neutral-300"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleImageUpload}
              disabled={uploadingImage || uploadedFiles.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-[#668e2b] hover:bg-[#b8e025] text-black font-medium rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Photo'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSettings;