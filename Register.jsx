import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, User, Phone, ShieldCheck, UserCheck, Shield } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserAuth } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestedReturnTo = safeReturnTo();
  const returnTo = requestedReturnTo === "/" ? "/dashboard" : requestedReturnTo;

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail.trim());
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please provide a valid email address");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const res = await db.auth.register({
        email: email.trim(),
        password,
        full_name: fullName.trim() || email.split('@')[0],
        phone: phone.trim(),
        role,
      });

      toast({
        title: "Registration Successful",
        description: `Welcome! Your ${role.toUpperCase()} account has been provisioned in the database.`,
      });

      await checkUserAuth();

      // Role-based redirect to dedicated portal
      if (role === 'admin') {
        navigate('/enterprise-admin', { replace: true });
      } else if (role === 'officer' || role === 'authority') {
        navigate('/authority-handover', { replace: true });
      } else {
        navigate(returnTo || '/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err?.message || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Register into Supabase database with role-based permissions"
      footer={
        <>
          Already registered in the database?{" "}
          <Link
            to={"/login" + (requestedReturnTo !== "/" ? "?returnTo=" + encodeURIComponent(requestedReturnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Log in here
          </Link>
        </>
      }
    >
      {searchParams.get('email') && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
          <p className="font-semibold">Completing Registration</p>
          <p className="mt-0.5 text-blue-700">
            Pre-filled with credentials not found during login: <span className="font-mono font-bold">{email}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullname">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="fullname"
              type="text"
              autoComplete="name"
              placeholder="Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Contact Phone (Optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 (555) 019-2834"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Account Role Selector */}
        <div className="space-y-1.5">
          <Label>System Role</Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                role === "user"
                  ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
              }`}
            >
              <UserCheck className={`w-4 h-4 mb-1.5 ${role === "user" ? "text-blue-600" : "text-slate-400"}`} />
              <div>
                <p className="text-xs font-bold leading-tight">Citizen</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Item Reporter</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("officer")}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                role === "officer"
                  ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
              }`}
            >
              <ShieldCheck className={`w-4 h-4 mb-1.5 ${role === "officer" ? "text-emerald-600" : "text-slate-400"}`} />
              <div>
                <p className="text-xs font-bold leading-tight">Officer</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Campus Custody</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                role === "admin"
                  ? "border-purple-600 bg-purple-50/80 text-purple-900 ring-2 ring-purple-500/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
              }`}
            >
              <Shield className={`w-4 h-4 mb-1.5 ${role === "admin" ? "text-purple-600" : "text-slate-400"}`} />
              <div>
                <p className="text-xs font-bold leading-tight">Admin</p>
                <p className="text-[10px] text-slate-500 mt-0.5">System Console</p>
              </div>
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-medium btn-interactive bg-blue-600 hover:bg-blue-700 mt-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Provisioning User in Database...
            </>
          ) : (
            `Register as ${role.toUpperCase()} & Launch Portal`
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}