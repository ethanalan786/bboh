"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Search, User, Clock } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  user: {
    name: string | null;
    email: string | null;
    role: string | null;
  } | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  description: string;
  previousValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  SALE_CREATED: "Sale Created",
  SALE_ADJUSTED: "Sale Adjusted",
  SALE_DELETED: "Sale Deleted",
  INVENTORY_UPDATED: "Inventory Updated",
  INVOICE_UPLOADED: "Invoice Uploaded",
  INVOICE_APPROVED: "Invoice Approved",
  ADJUSTMENT_MADE: "Adjustment Made",
  PRODUCT_ADDED: "Product Added",
  PRODUCT_DELETED: "Product Deleted",
  PRODUCT_UPDATED: "Product Updated",
};

const ACTION_COLORS: Record<string, string> = {
  SALE_CREATED: "bg-emerald-900/60 text-emerald-400 border-emerald-800/40",
  SALE_ADJUSTED: "bg-amber-900/60 text-amber-400 border-amber-800/40",
  SALE_DELETED: "bg-red-900/60 text-red-400 border-red-800/40",
  INVENTORY_UPDATED: "bg-blue-900/60 text-blue-400 border-blue-800/40",
  INVOICE_UPLOADED: "bg-purple-900/60 text-purple-400 border-purple-800/40",
  INVOICE_APPROVED: "bg-green-900/60 text-green-400 border-green-800/40",
  ADJUSTMENT_MADE: "bg-orange-900/60 text-orange-400 border-orange-800/40",
  PRODUCT_ADDED: "bg-teal-900/60 text-teal-400 border-teal-800/40",
  PRODUCT_DELETED: "bg-rose-900/60 text-rose-400 border-rose-800/40",
  PRODUCT_UPDATED: "bg-cyan-900/60 text-cyan-400 border-cyan-800/40",
};

export default function AuditTrailContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push("/dashboard/front-desk-role");
    }
  }, [status, session, router]);

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const response = await fetch('/api/audit-logs');
        if (response.ok) {
          const data = await response.json();
          setAuditLogs(data);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLogs();
  }, []);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      searchQuery === "" ||
      (log.user?.name && log.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.user?.email && log.user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesAction = actionFilter === "all" || log.actionType === actionFilter;
    const matchesEntity = entityFilter === "all" || log.entityType === entityFilter;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.actionType)));
  const uniqueEntities = Array.from(new Set(auditLogs.map(log => log.entityType)));

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Audit Trail</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Complete history of all employee actions, sales, inventory changes, and system modifications.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-[#0a0a0a] border border-[#0a0a0a] rounded-xl px-4 py-2.5">
          <Search size={15} className="text-neutral-500 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by employee, description, or entity ID..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-neutral-600"
          />
        </div>

        <Combobox
          items={["all", ...uniqueActions]}
          value={actionFilter}
          onValueChange={(value) => setActionFilter(value ?? "all")}
        >
          <ComboboxInput placeholder="All Actions" />
          <ComboboxContent>
            <ComboboxEmpty>No actions found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item === "all" ? "All Actions" : ACTION_LABELS[item] || item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Combobox
          items={["all", ...uniqueEntities]}
          value={entityFilter}
          onValueChange={(value) => setEntityFilter(value ?? "all")}
        >
          <ComboboxInput placeholder="All Entities" />
          <ComboboxContent>
            <ComboboxEmpty>No entities found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item === "all" ? "All Entities" : item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#0a0a0a] rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#0a0a0a]">
                <TableHead className="text-xs font-medium text-neutral-500">Date & Time</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">Employee</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">Action</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">Entity</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">Description</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">Changes</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-b border-[#0a0a0a] hover:bg-[#0a0a0a]">
                  <TableCell className="text-sm text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-neutral-500" />
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                        <User size={14} className="text-neutral-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{log.user?.name || 'Unknown User'}</div>
                        <div className="text-xs text-neutral-500">{log.user?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={ACTION_COLORS[log.actionType] || "bg-gray-900/60 text-gray-400 border-gray-800/40"}
                    >
                      {ACTION_LABELS[log.actionType] || log.actionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-300">{log.entityType}</TableCell>
                  <TableCell className="text-sm text-neutral-300 max-w-xs truncate">{log.description}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {log.previousValue && (
                        <div className="text-red-400 mb-1">
                          <span className="text-neutral-500">Before:</span> {log.previousValue.substring(0, 50)}...
                        </div>
                      )}
                      {log.newValue && (
                        <div className="text-emerald-400">
                          <span className="text-neutral-500">After:</span> {log.newValue.substring(0, 50)}...
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">{log.ipAddress || 'N/A'}</TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-12 text-center text-neutral-500 text-sm">
                    No audit logs found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
