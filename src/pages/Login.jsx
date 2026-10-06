import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Fingerprint, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";
import { safeEnableBiometrics, safeAuthenticateBiometric, safeStorage } from "@/lib/nativePluginsHelper";
import { toast } from "@/components/ui/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, checkUserAuth } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userNotFound, setUserNotFound] = useState(false);
  const [notFoundEmail, setNotFoundEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingUserRes, setPendingUserRes] = useState(null);

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const returnTo = safeReturnTo(searchParams?.get('returnTo'));

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      routeUserByRole(currentUser);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    async function checkBio() {
      const bioEnabled = await safeStorage.get('findback_biometric_enabled');
      if (bioEnabled === 'true') {
        setBiometricAvailable(true);
      }
    }
    checkBio();
  }, []);

  const routeUserByRole = (user) => {
    const userRole = user?.role || 'user';
    let target = returnTo;
    if (!target || target === '/' || target.includes('/login') || target.includes('/register') || target.includes('/forgot-password') || target.includes('/reset-password')) {
      target = '/dashboard';
    }
    if (userRole === 'admin') {
      navigate('/enterprise-admin', { replace: true });
    } else if (userRole === 'campus' || userRole === 'officer' || userRole === 'authority') {
      navigate('/authority-handover', { replace: true });
    } else {
      navigate(target, { replace: true });
    }
  };

  const [slowLoading, setSlowLoading] = useState(false);

  const performLogin = async (loginEmail, loginPassword) => {
    setError("");
    setUserNotFound(false);
    setLoading(true);
    setSlowLoading(false);
    const slowTimer = setTimeout(() => setSlowLoading(true), 3500);
    try {
      const res = await db.auth.loginViaEmailPassword(loginEmail, loginPassword);
      if (res?.access_token) {
        db.auth.setToken(res.access_token);
      }

      // If the response contains user data, route immediately
      if (res?.user) {
        clearTimeout(slowTimer);
        setLoading(false);
        setSlowLoading(false);
        routeUserByRole(res.user);
        return;
      }

      // Otherwise refresh auth state - the useEffect watching isAuthenticated/currentUser will route
      await checkUserAuth();
      // routeUserByRole will be triggered by the useEffect on [isAuthenticated, currentUser]
    } catch (err) {
      if (err?.code === 'USER_NOT_FOUND' || err?.status === 404 || err?.message?.toLowerCase().includes('not found')) {
        setUserNotFound(true);
        setNotFoundEmail(loginEmail);
        setError("Account not found in the database. Please register for an account.");
      } else {
        setError(err?.message || "Invalid email or password");
      }
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlowLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(email, password);
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const bioUser = await safeAuthenticateBiometric();
      toast({
        title: "Touch ID / Face ID Verified",
        description: `Authenticated successfully as ${bioUser.full_name || bioUser.email}`
      });
      await performLogin(bioUser.email, bioUser.password);
    } catch (err) {
      setError(err?.message || "Biometric authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometricsConfirm = async () => {
    if (pendingUserRes?.user) {
      await safeEnableBiometrics(pendingUserRes.user, password);
      toast({
        title: "Biometric Authentication Activated",
        description: "Touch ID / Face ID is now enabled for 1-tap fast logins!"
      });
    }
    setShowBiometricModal(false);
    routeUserByRole(pendingUserRes?.user);
  };

  const handleSkipBiometrics = () => {
    setShowBiometricModal(false);
    routeUserByRole(pendingUserRes?.user);
  };

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector variant="outline" size="sm" />
      </div>
      <AuthLayout
        icon={LogIn}
        title={t('login.title') || "Welcome back"}
        subtitle={t('login.subtitle') || "Log in to your account with verified credentials"}
        footer={
          <>
            {t('login.no_account') || "Don't have an account?"}{" "}
            <Link
              to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
              className="text-primary font-medium hover:underline"
            >
              {t('login.create_one') || "Create one"}
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
          <Label htmlFor="email">Email address / Username</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="text"
              autoComplete="username"
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

        {slowLoading && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center font-medium animate-pulse">
            ⚡ Connecting to cloud server (warming up backend, please wait)...
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="submit" className="flex-1 h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {slowLoading ? 'Waking Up Backend...' : 'Logging in...'}
              </>
            ) : (
              "Log in"
            )}
          </Button>

          {biometricAvailable && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBiometricLogin}
              className="h-12 px-4 border-slate-700 hover:bg-slate-800 text-slate-200"
              title="Log in with Touch ID / Face ID"
            >
              <Fingerprint className="w-5 h-5 text-indigo-400" />
            </Button>
          )}
        </div>
      </form>

      {/* Biometrics Authorization Modal Prompt */}
      {showBiometricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Fingerprint className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-100">Enable Biometric Login?</h3>
              <p className="text-xs text-slate-400">
                Use Touch ID, Face ID, or your device biometric scanner for fast logins on FindBack AI.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-left text-xs space-y-1 text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Hardware Secured
              </div>
              <p className="text-slate-400">
                Your credentials will be stored safely inside your device's native secure enclave.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={handleSkipBiometrics}
                className="flex-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleEnableBiometricsConfirm}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Enable Biometrics
              </Button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
    </div>
  );
}