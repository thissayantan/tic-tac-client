"use client";

import { useState, useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthService } from "@/lib/auth-service";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is already logged in
    if (AuthService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);
  
  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.login(username, password);
      
      if (response.success) {
        router.push('/');
      } else {
        setError(response.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.register(username, password);
      
      if (response.success) {
        router.push('/');
      } else {
        setError(response.error || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Tic Tac Toe</h1>
      <AuthForm
        onLogin={handleLogin}
        onRegister={handleRegister}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
