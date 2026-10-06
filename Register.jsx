import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, User, Phone, UserCheck, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import NativePermissionsModal from "@/NativePermissionsModal";
import { fetchNativeSimPhoneNumber } from "./nativePluginsHelper";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserAuth } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNum, setPhoneNum] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityKey, setSecurityKey] = useState("SEC123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPhone, setFetchingPhone] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);

  const requestedReturnTo = safeReturnTo();
  const returnTo = requestedReturnTo === "/" ? "/dashboard" : requestedReturnTo;

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail.trim());
    }
  }, [searchParams]);

  // Real SIM Mobile Number Auto-Detection (Banking App / GPay Style via Android SubscriptionManager & Credential API)
  const handleAutoFetchPhone = async () => {
    setFetchingPhone(true);
    try {
      const res = await fetchNativeSimPhoneNumber();
      if (res && res.success && res.phoneNumber) {
        // Strip country code prefix if returned by native SIM info
        let numOnly = res.phoneNumber.replace(/^\+91|^91/, '').trim();
        setPhoneNum(numOnly);
        toast({
          title: "SIM Mobile Number Auto-Detected",
          description: `Auto-populated real device SIM number (${countryCode} ${numOnly}).`
        });
      } else {
        toast({
          title: "Manual Entry Required",
          description: res.message || "Could not detect SIM number. Please enter your mobile number manually."
        });
      }
    } catch (err) {
      console.warn('[Phone Fetch Error]:', err);
      toast({
        title: "Manual Entry Required",
        description: "Please enter your mobile phone number manually."
      });
    } finally {
      setFetchingPhone(false);
    }
  };

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
    if (!securityKey.trim() || securityKey.trim().length !== 6) {
      setError("Security Key must be exactly 6 characters long");
      return;
    }

    const fullPhoneString = phoneNum.trim() ? `${countryCode} ${phoneNum.trim()}` : '';

    setLoading(true);
    try {
      const res = await db.auth.register({
        email: email.trim(),
        password,
        security_key: securityKey.trim(),
        full_name: fullName.trim() || email.split('@')[0],
        phone: fullPhoneString,
        role: 'user',
      });

      if (res?.access_token) {
        db.auth.setToken(res.access_token);
      }

      toast({
        title: "Registration Successful",
        description: `Welcome! Your Citizen account has been provisioned in the database.`,
      });

      await checkUserAuth();
      navigate(returnTo || '/dashboard', { replace: true });
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

        {/* Telegram-Style Mobile Phone Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="phone">Mobile Phone Number</Label>
            <button
              type="button"
              onClick={handleAutoFetchPhone}
              disabled={fetchingPhone}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              {fetchingPhone ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Zap className="w-3 h-3 text-amber-500 mr-0.5" />
              )}
              <span>Auto-Detect SIM</span>
            </button>
          </div>

          <div className="flex space-x-2">
            {/* Country Dial Code Dropdown */}
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="h-11 px-2.5 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>

            {/* Phone Number Input */}
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                value={phoneNum}
                onChange={(e) => setPhoneNum(e.target.value.replace(/[^\d\s-]/g, ''))}
                className="pl-10 h-11 font-mono text-sm"
              />
              {phoneNum.length >= 8 && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>
        </div>

        {/* Enforced System Role Info */}
        <div className="space-y-1.5">
          <Label>System Role</Label>
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">Citizen (Item Reporter)</p>
                <p className="text-[11px] text-blue-700">Standard user account for lost & found reporting</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-md">
              Default
            </span>
          </div>
        </div>

        {/* App Permissions Guard Prompt */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setPermissionsModalOpen(true)}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs text-slate-700 font-medium transition-colors"
          >
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Configure Android Permissions (Location, Camera, Notifications)</span>
            </div>
            <span className="text-blue-600 font-semibold text-[11px]">Manage &rarr;</span>
          </button>
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

        {/* 6-Character Security Key for Account Recovery */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="securityKey">6-Character Security Key (Account Recovery)</Label>
            <span className="text-[10px] text-muted-foreground font-semibold">6 Characters</span>
          </div>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" aria-hidden="true" />
            <Input
              id="securityKey"
              type="text"
              maxLength={6}
              placeholder="SEC123"
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value.toUpperCase().substring(0, 6))}
              className="pl-10 h-11 font-mono uppercase font-bold tracking-widest border-indigo-200 focus:border-indigo-500"
              required
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Keep this key safe! Used to recover your account if you forget your password.
          </p>
        </div>

        <Button type="submit" className="w-full h-12 font-medium btn-interactive bg-blue-600 hover:bg-blue-700 mt-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Provisioning User in Database...
            </>
          ) : (
            "Register as Citizen & Launch Portal"
          )}
        </Button>
      </form>

      {/* Permissions Modal */}
      <NativePermissionsModal
        isOpen={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
      />
    </AuthLayout>
  );
}