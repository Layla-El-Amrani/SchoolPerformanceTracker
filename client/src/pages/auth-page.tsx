import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { t } = useTranslation();
  const { user, loginMutation, resetPasswordMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Define schemas with translations for error messages
  const loginSchema = z.object({
    email: z.string().email({ message: t('auth.errors.invalidEmail') }),
    password: z.string().min(6, { message: t('auth.errors.shortPassword') }),
  });
  
  const resetPasswordSchema = z.object({
    email: z.string().email({ message: t('auth.errors.invalidEmail') }),
  });
  
  type LoginFormValues = z.infer<typeof loginSchema>;
  type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Reset password form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Handle login form submission
  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }
  
  // Handle reset password form submission
  function onResetPasswordSubmit(data: ResetPasswordFormValues) {
    resetPasswordMutation.mutate(data);
    setShowResetModal(false);
    resetPasswordForm.reset();
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6">
        {/* Hero section */}
        <div className="hidden md:flex flex-col justify-center p-6 bg-primary text-white rounded-lg">
          <h1 className="text-3xl font-bold mb-4">{t('app.title')}</h1>
          <p className="text-lg mb-6">
            {t('auth.heroDescription')}
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                  <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm9.3 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">{t('auth.feature1.title')}</h3>
                <p className="text-sm text-white/80">{t('auth.feature1.description')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">{t('auth.feature2.title')}</h3>
                <p className="text-sm text-white/80">{t('auth.feature2.description')}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">{t('auth.feature3.title')}</h3>
                <p className="text-sm text-white/80">{t('auth.feature3.description')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Auth forms */}
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-primary">{t('app.title')}</h1>
              <p className="text-muted-foreground">{t('app.subtitle')}</p>
            </div>
            
            {/* Login Form */}
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="school.director@example.edu"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs text-primary p-0 h-auto"
                    onClick={() => setShowResetModal(true)}
                  >
                    {t('auth.forgotPassword')}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...loginForm.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? t('common.loading') : t('auth.signIn')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Reset Password Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.resetPassword')}</DialogTitle>
            <DialogDescription>
              {t('auth.resetPasswordDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t('auth.email')}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="school.director@example.edu"
                {...resetPasswordForm.register("email")}
              />
              {resetPasswordForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {resetPasswordForm.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? t('common.loading') : t('auth.sendResetLink')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
