import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Search, Plus, Pencil, Check, X, RefreshCw, DollarSign, Award, MessageSquare } from "lucide-react";
import { UserProfile } from "../../types";
import { Button } from "../../components/ui/button";

export default function Payouts() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [activeModal, setActiveModal] = useState<"add" | "edit" | "update" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Form values
  const [rentalIncentive, setRentalIncentive] = useState<string>("0");
  const [salesIncentive, setSalesIncentive] = useState<string>("0");
  const [incentiveComments, setIncentiveComments] = useState<string>("");

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

  const openModal = (type: "add" | "edit" | "update", user: UserProfile) => {
    setSelectedUser(user);
    setActiveModal(type);
    
    if (type === "add") {
      // For Add, we default to "0" input but it will add/accrue to their existing ones
      setRentalIncentive("0");
      setSalesIncentive("0");
      setIncentiveComments("");
    } else if (type === "edit") {
      // For Edit, we pre-populate existing values for precise modification
      setRentalIncentive(String(user.rental_incentive || 0));
      setSalesIncentive(String(user.sales_incentive || 0));
      setIncentiveComments(user.incentive_comments || "");
    } else if (type === "update") {
      // For Update, we show existing values so they can update and save them
      setRentalIncentive(String(user.rental_incentive || 0));
      setSalesIncentive(String(user.sales_incentive || 0));
      setIncentiveComments(user.incentive_comments || "");
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
    setRentalIncentive("0");
    setSalesIncentive("0");
    setIncentiveComments("");
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const parsedRental = parseFloat(rentalIncentive) || 0;
      const parsedSales = parseFloat(salesIncentive) || 0;

      let finalRental = 0;
      let finalSales = 0;
      let finalComments = "";

      if (activeModal === "add") {
        // Add values onto current ones
        finalRental = (selectedUser.rental_incentive || 0) + parsedRental;
        finalSales = (selectedUser.sales_incentive || 0) + parsedSales;
        
        // Append comment if there's any existing, separating with a timeline
        const dateStr = new Date().toLocaleDateString();
        const newCommentPart = incentiveComments.trim();
        const existingComments = selectedUser.incentive_comments || "";

        if (newCommentPart) {
          finalComments = existingComments 
            ? `${existingComments}\n[${dateStr} Add]: ${newCommentPart}` 
            : `[${dateStr} Add]: ${newCommentPart}`;
        } else {
          finalComments = existingComments;
        }
      } else if (activeModal === "edit") {
        // Direct assignment/overwrite
        finalRental = parsedRental;
        finalSales = parsedSales;
        finalComments = incentiveComments;
      } else if (activeModal === "update") {
        // Direct assignment/overwrite/modification
        finalRental = parsedRental;
        finalSales = parsedSales;
        finalComments = incentiveComments;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          rental_incentive: finalRental,
          sales_incentive: finalSales,
          incentive_comments: finalComments,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success(`Incentives successfully processed via ${activeModal?.toUpperCase()} operation!`);
      closeModal();
      fetchUsers();
    } catch (err: any) {
      toast.error("Failed to commit changes to Supabase: " + err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (u.name || "").toLowerCase().includes(q);
      const phoneMatch = (u.phone || "").toLowerCase().includes(q);
      const emailMatch = (u.email || "").toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Upper section with titles and search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Payout & Incentives Registry</h2>
          <p className="text-sm text-slate-500">Track and allocate sales bonuses, rental commissions, and notes for all team members.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 shadow-sm"
          />
        </div>
      </div>



      {/* Users table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">User Incentive Ledgers</h3>
          <button 
            onClick={fetchUsers} 
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900 shadow-sm bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wider">Full Name</th>
                <th className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wider">Mobile Number</th>
                <th className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wider">Rental Incentive</th>
                <th className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wider">Sales Incentive</th>
                <th className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wider">Incentive Comments</th>
                <th className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading team payouts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic">
                    No users found matching requirements.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {u.name || "N/A"}
                    </td>
                    
                    {/* Phone - Used during profile creation */}
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap font-mono text-xs">
                      {u.phone || "No phone added"}
                    </td>

                    {/* Rental Incentive */}
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        ₹{(u.rental_incentive || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Sales Incentive */}
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                        ₹{(u.sales_incentive || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Incentive Comments */}
                    <td className="px-5 py-4 text-slate-500 max-w-xs truncate" title={u.incentive_comments || ""}>
                      {u.incentive_comments ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{u.incentive_comments}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-xs">No comments recorded</span>
                      )}
                    </td>

                    {/* Actions with Add, Edit, Update */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm gap-0.5">
                        <button
                          onClick={() => openModal("add", u)}
                          title="Add / Accrue Incentives"
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 text-emerald-700 rounded-md text-xs font-bold transition-all shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                        <button
                          onClick={() => openModal("edit", u)}
                          title="Edit Directly"
                          className="flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 text-amber-700 rounded-md text-xs font-bold transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => openModal("update", u)}
                          title="Update / Re-allocate Values"
                          className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 text-blue-700 rounded-md text-xs font-bold transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog container for Add / Edit / Update */}
      {activeModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeModal === "add" && `Add Payout Incentives`}
                  {activeModal === "edit" && `Edit Incentives Ledger`}
                  {activeModal === "update" && `Update Incentives`}
                </h3>
                <p className="text-xs text-slate-500">
                  Recipient Profile: <strong className="text-slate-700">{selectedUser.name}</strong> ({selectedUser.phone || "No Mobile"})
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleActionSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                {activeModal === "add" && (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800 text-xs flex items-start gap-2">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Addition Mode:</strong> Values inputted below will be <strong>added to</strong> the current ledger balances (Current Rental: ₹{selectedUser.rental_incentive || 0}, Current Sales: ₹{selectedUser.sales_incentive || 0}).
                    </div>
                  </div>
                )}
                {activeModal === "edit" && (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-amber-800 text-xs flex items-start gap-2">
                    <Pencil className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Direct Edit Mode:</strong> Modifying these fields directly overrides data in the database.
                    </div>
                  </div>
                )}
                {activeModal === "update" && (
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-blue-800 text-xs flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Update Mode:</strong> Overwrite, re-calculate, or save the latest parameters for this user.
                    </div>
                  </div>
                )}

                {/* Rental Incentive */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-wider">
                    {activeModal === "add" ? "Rental Incentive to Add (₹)" : "Rental Incentive (₹)"}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</div>
                    <input 
                      type="number"
                      step="any"
                      min="0"
                      value={rentalIncentive}
                      onChange={(e) => setRentalIncentive(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none transition-all font-bold"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Sales Incentive */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-wider">
                    {activeModal === "add" ? "Sales Incentive to Add (₹)" : "Sales Incentive (₹)"}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</div>
                    <input 
                      type="number"
                      step="any"
                      min="0"
                      value={salesIncentive}
                      onChange={(e) => setSalesIncentive(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none transition-all font-bold"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-wider">
                    Incentive Comments
                  </label>
                  <textarea 
                    value={incentiveComments}
                    onChange={(e) => setIncentiveComments(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none transition-all"
                    placeholder={activeModal === "add" ? "e.g. Added ₹500 for high-volume deal support..." : "Internal accounting ledger remarks..."}
                    required={activeModal === "add"} // comments are useful to describe additions
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeModal}
                  className="flex-1 rounded-xl h-11 font-bold text-slate-600 border-slate-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className={`flex-1 rounded-xl h-11 font-bold text-white shadow-lg transition-all ${
                    activeModal === 'add' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                      : activeModal === 'edit'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  {activeModal === "add" && "Confirm Add"}
                  {activeModal === "edit" && "Save Changes"}
                  {activeModal === "update" && "Confirm Update"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
