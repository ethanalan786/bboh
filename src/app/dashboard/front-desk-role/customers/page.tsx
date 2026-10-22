"use client";

import FdrSidebar from '@/components/front-desk-role/fdr-sidebar';
import { FdrDashboardHeader } from '@/components/front-desk-role/fdr-dashboard-header';
import { GooeyInput, SearchResult } from '@/components/ui/gooey-input';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Plus,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt?: string;
}

const CustomerManagement = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role === 'ADMIN') {
      router.push("/dashboard/admin");
    }
  }, [status, session, router]);

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

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const data = await response.json();
          // API returns { customers: [...] }
          const customerUsers = (data.customers || []).filter((user: any) =>
            !['ADMIN', 'FRONT_DESK', 'INVENTORY'].includes(user.role)
          );
          setCustomers(customerUsers);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  // Convert customers to search results for GooeyInput
  const customerSearchResults: SearchResult<Customer>[] = customers.map(customer => ({
    id: customer.id,
    label: customer.name,
    data: customer
  }));

  const handleCustomerSelect = (result: SearchResult<Customer>) => {
    setSearchQuery(result.label);
    // Optional: scroll to or highlight the selected customer
  };

  const customerFilterFunction = (result: SearchResult<Customer>, searchQuery: string): boolean => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = result.label.toLowerCase().includes(searchLower);
    const emailMatch = result.data?.email?.toLowerCase().includes(searchLower) ?? false;
    const phoneMatch = result.data?.phone?.includes(searchQuery) ?? false;
    return nameMatch || emailMatch || phoneMatch;
  };

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.email) {
      toast.add({
        type: "error",
        description: "Name and email are required",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add customer');
      }

      const data = await response.json();
      setCustomers([...customers, data.customer]);
      setShowAddDialog(false);
      setFormData({ name: '', email: '', phone: '' });

      toast.add({
        type: "success",
        description: "Customer added successfully!",
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : 'Failed to add customer',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !formData.name || !formData.email) {
      toast.add({
        type: "error",
        description: "Name and email are required",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update customer');
      }

      const data = await response.json();
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? data.customer : c));
      setShowEditDialog(false);
      setSelectedCustomer(null);
      setFormData({ name: '', email: '', phone: '' });

      toast.add({
        type: "success",
        description: "Customer updated successfully!",
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : 'Failed to update customer',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      setCustomers(customers.filter(c => c.id !== selectedCustomer.id));
      setShowDeleteDialog(false);
      setSelectedCustomer(null);

      toast.add({
        type: "success",
        description: "Customer deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.add({
        type: "error",
        description: 'Failed to delete customer',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteDialog(true);
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

  return (
    <div className="flex h-screen overflow-hidden font-saprona bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FdrSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FdrDashboardHeader
          placeholder="Search customers..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={customerSearchResults}
          onResultSelect={handleCustomerSelect}
          minSearchLength={1}
          filterFunction={customerFilterFunction}
          renderResult={(result) => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600">
                {result.data?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{result.label}</p>
                <p className="text-xs text-neutral-500">{result.data?.email}</p>
              </div>
            </div>
          )}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Title row */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border border-[#668e2b]/40 bg-[#668e2b]/10 flex items-center justify-center">
                <User size={18} className="text-[#668e2b]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Customer Management</h1>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Manage customer profiles and information
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2 bg-[#668E2B] text-black rounded-xl px-5 py-3 hover:bg-[#7a9f3a] transition-colors"
              >
                <Plus size={15} className='text-white mr-1' />
                <div>
                  <p className="text-sm font-semibold text-white">Add Customer</p>
                  <p className="text-xs opacity-80 text-white">New profile</p>
                </div>
              </button>
            </div>
          </div>

          {/* Customer Table */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-[#1a1a1a] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-neutral-500 dark:text-neutral-500 border-b border-neutral-200 dark:border-[#1a1a1a]">
                    <th className="font-medium px-5 py-3">Customer</th>
                    <th className="font-medium px-5 py-3">Email</th>
                    <th className="font-medium px-5 py-3">Phone</th>
                    <th className="font-medium px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-neutral-200 dark:border-[#161616] last:border-0 hover:bg-gray-200 dark:hover:bg-[#151515] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600">
                            {customer.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{customer.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                        {customer.email}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                        {customer.phone || '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDialog(customer)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-200 dark:bg-[#1a1a1a] hover:bg-neutral-300 dark:hover:bg-[#222] border border-neutral-300 dark:border-[#242424] text-neutral-600 dark:text-neutral-400 transition-colors"
                            title="Edit customer"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(customer)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 transition-colors"
                            title="Delete customer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-neutral-500 dark:text-neutral-500 text-sm">
                        {searchQuery ? "No customers match your search." : "No customers found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white dark:bg-[#111] border-neutral-200 dark:border-[#1a1a1a] text-neutral-900 dark:text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Customer</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Create a new customer profile
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1.5">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
                className="w-full bg-neutral-100 dark:bg-[#1a1a1a] rounded-lg px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none border-neutral-200 dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
                className="w-full bg-neutral-100 dark:bg-[#1a1a1a] rounded-lg px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none border-neutral-200 dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1.5">Phone (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-neutral-100 dark:bg-[#1a1a1a] rounded-lg px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none border-neutral-200 dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowAddDialog(false);
                setFormData({ name: '', email: '', phone: '' });
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 dark:bg-[#1a1a1a] hover:bg-neutral-200 dark:hover:bg-[#222] border border-neutral-200 dark:border-[#242424] rounded-lg px-4 py-3 transition-colors text-neutral-700 dark:text-neutral-300"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleAddCustomer}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-[#668e2b] hover:bg-[#7a9f3a] text-black font-medium rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Customer
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white dark:bg-[#111] border-neutral-200 dark:border-[#1a1a1a] text-neutral-900 dark:text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Customer</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Update customer information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1.5">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
                className="w-full bg-neutral-100 dark:bg-[#1a1a1a] rounded-lg px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none border-neutral-200 dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
                className="w-full bg-neutral-100 dark:bg-[#1a1a1a] rounded-lg px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none border-neutral-200 dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1.5">Phone (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-neutral-100 dark:bg-[#1a1a1a] rounded-lg px-4 py-3 text-neutral-900 dark:text-neutral-100 outline-none border-neutral-200 dark:border-[#242424] focus:border-[#668e2b] focus:ring-1 focus:ring-[#668e2b]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowEditDialog(false);
                setSelectedCustomer(null);
                setFormData({ name: '', email: '', phone: '' });
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 dark:bg-[#1a1a1a] hover:bg-neutral-200 dark:hover:bg-[#222] border border-neutral-200 dark:border-[#242424] rounded-lg px-4 py-3 transition-colors text-neutral-700 dark:text-neutral-300"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleEditCustomer}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-[#668e2b] hover:bg-[#7a9f3a] text-black font-medium rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit size={16} />
                  Update Customer
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white dark:bg-[#111] border-neutral-200 dark:border-[#1a1a1a] text-neutral-900 dark:text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Customer</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              Are you sure you want to delete {selectedCustomer?.name || 'this customer'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedCustomer(null);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 dark:bg-[#1a1a1a] hover:bg-neutral-200 dark:hover:bg-[#222] border border-neutral-200 dark:border-[#242424] rounded-lg px-4 py-3 transition-colors text-neutral-700 dark:text-neutral-300"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleDeleteCustomer}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Customer
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;