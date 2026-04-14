import { useState } from "wouter";
import { useLocation } from "wouter";
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState as useReactState } from "react";

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [username, setUsername] = useReactState("student1");
  const [password, setPassword] = useReactState("password");

  // Check if already logged in
  const { data: user } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  if (user) {
    setLocation(user.role === "student" ? "/student/dashboard" : "/advisor/dashboard");
  }

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: "Welcome back",
          description: "Successfully signed in.",
        });
        if (data.role === "student") {
          setLocation("/student/dashboard");
        } else {
          setLocation("/advisor/dashboard");
        }
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Invalid username or password. Please try again.",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password } });
  };

  const setDemoCredentials = (role: "student" | "advisor") => {
    if (role === "student") {
      setUsername("student1");
      setPassword("password");
    } else {
      setUsername("advisor1");
      setPassword("password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-[#006747] transform -skew-y-6 -translate-y-[200px] z-0 opacity-10"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[#f6c042] blur-3xl opacity-5 z-0 transform translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-[420px] z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#006747] text-white shadow-lg shadow-[#006747]/20 mb-6">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Smart Advisor</h1>
          <p className="text-muted-foreground mt-2">Norfolk State University</p>
        </div>

        <Card className="border-0 shadow-xl shadow-black/5 rounded-2xl">
          <CardHeader className="space-y-1 pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-bold tracking-tight">Sign in</CardTitle>
            <CardDescription>
              Enter your NSU credentials to access the portal
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="e.g. j.doe" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm font-medium text-[#006747] hover:underline" onClick={(e) => e.preventDefault()}>
                    Forgot password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 bg-[#006747] hover:bg-[#005238] text-white font-medium text-base shadow-sm"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-muted-foreground">Demo Accounts</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button 
                  variant="outline" 
                  className="h-auto py-3 px-4 flex flex-col gap-2 items-center justify-center border-gray-200 hover:border-[#006747]/30 hover:bg-[#006747]/5"
                  onClick={() => setDemoCredentials("student")}
                  type="button"
                >
                  <GraduationCap className="h-5 w-5 text-[#006747]" />
                  <span className="text-xs font-medium">Student Demo</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 px-4 flex flex-col gap-2 items-center justify-center border-gray-200 hover:border-[#006747]/30 hover:bg-[#006747]/5"
                  onClick={() => setDemoCredentials("advisor")}
                  type="button"
                >
                  <Users className="h-5 w-5 text-[#006747]" />
                  <span className="text-xs font-medium">Advisor Demo</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
