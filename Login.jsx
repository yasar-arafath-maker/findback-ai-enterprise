import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, ShieldCheck, User, ShieldAlert } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestedReturnTo = safeReturnTo();
  const returnTo = requestedReturnTo === "/" ? "/dashboard" : requestedReturnTo;

  const handleQuickLogin = async (selectedRole) => {
    setError("");
    setLoading(true);
    const targetEmail = selectedRole === 'admin' ? 'admin@findback.app' : 'user@example.com';
    const targetPassword = selectedRole === 'admin' ? 'adminSecure!2026' : 'password123';
    setEmail(targetEmail);
    setPassword(targetPassword);
    try {
      const res = await db.auth.loginViaEmailPassword(targetEmail, targetPassword);
      if (res?.access_token) {
        db.auth.setToken(res.access_token);
      }
      await checkUserAuth();
      const destination = selectedRole === 'admin' ? '/admin' : (returnTo || '/dashboard');
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await db.auth.loginViaEmailPassword(email, password);
      if (res?.access_token) {
        db.auth.setToken(res.access_token);
      }
      await checkUserAuth();
      const destination = email.toLowerCase().includes('admin') ? '/admin' : (returnTo || '/dashboard');
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Authentication & Security"
      subtitle="Sign in as a Normal User or Admin Supervisor"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* ── Quick Role Switcher for Testing & Security Demonstration ── */}
      <div className="mb-6 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Select Role / Quick Login
          </p>
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            RBAC Enabled
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickLogin('user')}
            disabled={loading}
            className="flex flex-col items-start p-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50/80 hover:bg-blue-50/70 hover:border-blue-400 text-left transition-all active:scale-[0.98] group shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-blue-700">
              <User className="w-4 h-4 text-blue-600" />
              Normal User
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Student / Claimant</p>
            <span className="mt-2 text-[10px] font-mono bg-white px-2 py-0.5 rounded-md border text-slate-600">
              user@example.com
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('admin')}
            disabled={loading}
            className="flex flex-col items-start p-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 hover:border-amber-400 text-left transition-all active:scale-[0.98] group shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-amber-800">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Admin Authority
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Campus Security Desk</p>
            <span className="mt-2 text-[10px] font-mono bg-white px-2 py-0.5 rounded-md border border-amber-200 text-amber-800 font-semibold">
              admin@findback.app
            </span>
          </button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-slate-400 font-semibold">Or enter custom credentials</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying credentials...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      {/* ── Security Architecture Note ── */}
      <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
          Security & Access Model (RBAC):
        </div>
        <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
          <li><strong>Normal User:</strong> Report Lost/Found items, view matches, submit ownership proof, SafeChat, Smart Tag.</li>
          <li><strong>Admin Supervisor:</strong> Review Claims queue, approve handovers, verify 6-digit OTP, manage user suspensions.</li>
        </ul>
      </div>
    </AuthLayout>
  );
}