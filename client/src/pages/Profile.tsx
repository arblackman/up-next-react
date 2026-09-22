import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

export default function Profile() {
  const { user } = useUser();
  const { data: localUser, isLoading, error } = useQuery<User>({
    queryKey: ["/api/me"],
  });

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-card p-6">
        <Link href="/app">
          <Button variant="ghost" className="mb-6" data-testid="button-back-to-app">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to watchlist
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold">Your profile</h1>
        {isLoading ? (
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        ) : error || !localUser ? (
          <p className="mt-4 text-red-400">Your profile could not be loaded.</p>
        ) : (
          <div className="mt-6 space-y-2" data-testid="profile-account-data">
            <p className="text-lg font-medium">
              {user?.fullName || user?.firstName || "Up Next member"}
            </p>
            <p className="text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress || localUser.email}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}