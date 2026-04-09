import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Github, Chrome, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Login() {
  const { user, signInWithGoogle, signInWithGithub } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSignIn = async (method: 'google' | 'github') => {
    if (loading) return;
    setLoading(method);
    try {
      if (method === 'google') await signInWithGoogle();
      else await signInWithGithub();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/cancelled-popup-request') {
        // Ignore this error as it's usually just a duplicate click or user closing the popup
      } else {
        toast.error(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden mesh-gradient">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-vibrant-blue/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-vibrant-pink/20 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass shadow-2xl shadow-vibrant-purple/10 border-white/20">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-vibrant-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-vibrant-blue/30">
                <span className="text-white font-bold text-3xl">V</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">ViteHost</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-base">
              The enterprise-grade hosting platform for Vite projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 py-6">
            <Button
              variant="outline"
              className="w-full h-12 glass border-zinc-200 dark:border-zinc-800 hover:bg-vibrant-blue/5 transition-all text-base font-medium"
              onClick={() => handleSignIn('google')}
              disabled={!!loading}
            >
              {loading === 'google' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-5 w-5 text-vibrant-blue" />
              )}
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 glass border-zinc-200 dark:border-zinc-800 hover:bg-vibrant-purple/5 transition-all text-base font-medium"
              onClick={() => handleSignIn('github')}
              disabled={!!loading}
            >
              {loading === 'github' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Github className="mr-2 h-5 w-5 text-vibrant-purple" />
              )}
              Continue with GitHub
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <div className="text-xs text-center text-zinc-400">
              By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
