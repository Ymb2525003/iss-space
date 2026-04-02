"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAvailableNames, registerUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Users, Crown, User, Check, Mail, Lock } from "lucide-react";
import { LEADERS, type TeamMemberName } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const [selectedName, setSelectedName] = useState<TeamMemberName | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [names, setNames] = useState<{ name: TeamMemberName; taken: boolean }[]>([]);

  useEffect(() => {
    fetchAvailableNames().then(setNames).catch(() => {});
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedName) {
      toast.error("Select your name first.");
      return;
    }
    if (!email) {
      toast.error("Enter your email.");
      return;
    }
    if (!password) {
      toast.error("Enter the password.");
      return;
    }

    setIsLoading(true);

    try {
      await registerUser(selectedName, email, password);
      toast.success(`Registered as ${selectedName}! You can now login.`);
      router.push("/login");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Registration failed.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isLeader = (name: TeamMemberName) => LEADERS.includes(name as (typeof LEADERS)[number]);

  const renderNameButton = (entry: { name: TeamMemberName; taken: boolean }) => {
    const { name, taken } = entry;
    const isSelected = selectedName === name;
    const leader = isLeader(name);

    return (
      <button
        key={name}
        type="button"
        onClick={() => !taken && setSelectedName(name)}
        disabled={isLoading || taken}
        className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
          taken
            ? "cursor-not-allowed border-border/50 opacity-40"
            : isSelected
              ? "border-primary bg-primary/10 ring-2 ring-primary"
              : "border-border hover:border-primary/50 hover:bg-secondary/40"
        }`}
      >
        <div className="flex items-center gap-2">
          {leader ? <Crown className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium text-foreground">{name}</span>
        </div>
        {taken ? (
          <span className="text-xs text-red-400">Taken</span>
        ) : isSelected ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <span className="text-xs text-green-500">Available</span>
        )}
      </button>
    );
  };

  const leaders = names.filter((n) => isLeader(n.name));
  const members = names.filter((n) => !isLeader(n.name));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-accent p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Users className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Join ISS Team</CardTitle>
            <CardDescription className="mt-1">
              Claim your name by registering with your email
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {leaders.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Leaders
                </h3>
                <div className="grid gap-2">{leaders.map(renderNameButton)}</div>
              </div>
            )}

            {leaders.length > 0 && members.length > 0 && <div className="border-t border-border" />}

            {members.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Members
                </h3>
                <div className="grid gap-2">{members.map(renderNameButton)}</div>
              </div>
            )}

            <div className="border-t border-border" />

            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter team password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={!selectedName || !email || !password || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : selectedName ? (
                `Register as ${selectedName}`
              ) : (
                "Choose your name"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
