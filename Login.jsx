import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userNotFound, setUserNotFound] = useState(false);
  const [notFoundEmail, setNotFoundEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUserNotFound(false);
    setLoading(true);
    try {
      const res = await db.auth.loginViaEmailPassword(email, password);
      if (res?.access_token) {
        db.auth.setToken(res.access_token);
      }
      await checkUserAuth();

      // Role-based dashboard routing from verified database role
      const userRole = res?.user?.role || 'user';
      if (userRole === 'admin') {
        navigate('/enterprise-admin', { replace: true });
      } else if (userRole === 'officer' || userRole === 'authority') {
        navigate('/authority-handover', { replace: true });
      } else {
        navigate(requestedReturnTo !== '/' ? requestedReturnTo : '/dashboard', { replace: true });
      }
    } catch (err) {
      if (err?.code === 'USER_NOT_FOUND' || err?.status === 404 || err?.message?.toLowerCase().includes('not found')) {
        setUserNotFound(true);
        setNotFoundEmail(email);
        setError("Account not found in the database. Please register to create your account.");
      } else {
        setError(err?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account with Supabase database credentials"
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
      {userNotFound && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-full bg-amber-200 text-amber-800 text-xs font-bold mt-0.5">!</div>
            <div className="flex-1 text-sm">
              <p className="font-semibold text-amber-900">User Account Not Found</p>
              <p className="text-amber-700 text-xs mt-0.5">
                No matching account exists for <span className="font-mono font-bold text-amber-900">{notFoundEmail}</span> in the database.
              </p>
              <div className="mt-3">
                <Link
                  to={`/register?email=${encodeURIComponent(notFoundEmail)}`}
                  className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Create New Account with this Email →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !userNotFound && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

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
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}