import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Login: React.FC = () => {
  const { register, handleSubmit } = useForm();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      const phone = data.phone;
      const syntheticEmail = `${phone}@modarnet.internal`;

      const { error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: data.password,
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900 font-sans">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-left">
        <div className="mb-6">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6 text-white text-xl font-bold">
            M
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Modarnet</h1>
          <p className="text-xs text-slate-500 mb-8 text-center">Login with your mobile number</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 tracking-wider">Mobile Number</label>
            <input 
              {...register("phone", { required: true })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              placeholder="10-digit number"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 tracking-wider">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                {...register("password", { required: true })}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-bold uppercase tracking-wide text-xs">
            Sign In
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-slate-500 text-[11px] mb-2 uppercase tracking-widest font-bold">New to Modarnet?</p>
          <Link to="/signup" className="text-blue-600 font-semibold text-sm hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
