import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { syncServerRequest } from "@/api/base44Client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, KeyRound, ShieldCheck, Lock } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email address or username");
      return;
    }
    if (!securityKey.trim() || securityKey.trim().length !== 6) {
      setError("Please enter your 6-character Security Key created during registration");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      // Send reset request with security_key to backend server
      const res = await syncServerRequest('/api/auth/reset-password', 'POST', {
        email: email.trim(),
        security_key: securityKey.trim().toUpperCase(),
        newPassword,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      toast({
        title: "Password Updated Successfully",
        description: "Your password has been updated in the database. Please log in with your new password.",
      });

      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || "Security Key verification failed. Please check your 6-character Security Key and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={KeyRound}
      title="Reset Password"
      subtitle="Verify your 6-Character Security Key to reset your password"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        {/* Email or Username */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address / Username</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="text"
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

        {/* 6-Character Security Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="securityKey">6-Character Security Key</Label>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
              Registration Key
            </span>
          </div>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" aria-hidden="true" />
            <Input
              id="securityKey"
              type="text"
              maxLength={6}
              placeholder="SEC123"
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value.toUpperCase().substring(0, 6))}
              className="pl-10 h-12 font-mono uppercase font-bold tracking-widest text-lg border-indigo-700/60 focus:border-indigo-500"
              required
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Enter the 6-character Security Key you created during registration (e.g. <code>SEC123</code>).
          </p>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-medium bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying Security Key...
            </>
          ) : (
            "Verify Security Key & Reset Password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
