import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const SignUp: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    try {
      const phone = data.phone;
      // Use a synthetic email derived from the phone number to bypass SMS/OTP requirements
      // while still using Supabase Auth for session management and security.
      const syntheticEmail = `${phone}@modarnet.internal`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: syntheticEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            phone_number: phone
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        toast.success("Account created! You can now login.");
        navigate("/login");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Account</h2>
        <p className="text-slate-500 text-sm mb-6">Join Modarnet Rental & Services</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
            <input 
              {...register("name", { required: "Name is required" })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Number</label>
            <input 
              {...register("phone", { required: "Mobile is required", pattern: { value: /^[0-9]{10}$/, message: "Enter 10 digit mobile" } })}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="10-digit mobile"
            />
            {errors.phone && <p className="text-rose-500 text-[10px] mt-1">{errors.phone.message as string}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                {...register("password", { required: "Password is required", minLength: 6 })}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-10"
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
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-10">Sign Up</Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
};
