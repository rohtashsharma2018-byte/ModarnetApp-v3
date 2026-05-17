import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { toast } from "sonner";
import { Search, ShieldAlert, Shield, ShieldOff, Trash2 } from "lucide-react";
import { UserProfile } from "../../types";

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error("Error fetching users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const n = (u.name || "").toLowerCase();
      const e = (u.email || "").toLowerCase();
      return n.includes(q) || e.includes(q);
    }
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-700 border-purple-200";
      case "blocked": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Manage user accounts, roles, access, and permissions.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">All Users</h3>
          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
            {filteredUsers.length} users
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Joining Date</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">User Info</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Role & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-xs text-slate-500 italic font-medium">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">
                      <div className="text-xs font-bold text-slate-800">
                        {u.created_at ? format(new Date(u.created_at), "MMM d, yyyy") : "N/A"}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                        ID: {u.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-slate-900">{u.name || 'No Name'}</div>
                      <div className="text-xs text-slate-500">{u.email || u.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${getRoleBadge(u.role)}`}>
                        {u.role === 'admin' && <Shield className="w-3 h-3" />}
                        {u.role === 'blocked' && <ShieldOff className="w-3 h-3" />}
                        {u.role || 'user'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
