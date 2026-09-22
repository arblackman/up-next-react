import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Play, Clock, Check, Tv, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";
import { AiringIndicator } from "@/components/AiringIndicator";
import { StarRating } from "@/components/StarRating";

interface PublicShow {
  id: number;
  title: string;
  apiId: number | null;
  imageUrl: string | null;
  category: string;
  priority: number;
  status: string | null;
  nextEpisodeDate: string | null;
  nextEpisodeNumber: number | null;
  latestSeasonEpisodeCount: number | null;
  latestSeasonNumber: number | null;
  lastRefreshedAt: string | null;
  rating: number | null;
}

interface SharedListData {
  shows: PublicShow[];
  user: {
    firstName: string | null;
    profileImageUrl: string | null;
  } | null;
}

export default function SharedList() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data, isLoading, error } = useQuery<SharedListData>({
    queryKey: ['/api/shared', token],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading list...</div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-6xl mb-4">
          <Tv className="w-16 h-16 text-muted-foreground/30" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">List Not Found</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          This shared list doesn't exist or the link may have expired.
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Up Next
          </Button>
        </Link>
      </div>
    );
  }

  const shows = data.shows.sort((a, b) => a.priority - b.priority);
  const watchingShows = shows.filter(s => s.category === "watching");
  const nextShows = shows.filter(s => s.category === "next");
  const watchedShows = shows.filter(s => s.category === "watched");

  const userName = data.user.firstName || "Someone";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={data.user.profileImageUrl || undefined} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {userName[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                {userName}'s Watchlist
              </h1>
              <p className="text-sm text-muted-foreground">View-only</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-go-to-upnext">
              <Tv className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Start Your Own</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {shows.length === 0 ? (
          <div className="text-center py-16">
            <Tv className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">This list is empty</p>
          </div>
        ) : (
          <div className="space-y-8">
            {watchingShows.length > 0 && (
              <CategorySection
                title="Watching"
                icon={<Play className="w-4 h-4 text-green-400" />}
                shows={watchingShows}
                color="green"
              />
            )}
            {nextShows.length > 0 && (
              <CategorySection
                title="Up Next"
                icon={<Clock className="w-4 h-4 text-yellow-400" />}
                shows={nextShows}
                color="yellow"
              />
            )}
            {watchedShows.length > 0 && (
              <CategorySection
                title="Watched"
                icon={<Check className="w-4 h-4 text-blue-400" />}
                shows={watchedShows}
                color="blue"
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function CategorySection({
  title,
  icon,
  shows,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  shows: PublicShow[];
  color: "green" | "yellow" | "blue";
}) {
  const borderColor = {
    green: "border-green-500/30",
    yellow: "border-yellow-500/30",
    blue: "border-blue-500/30",
  }[color];

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-display font-semibold text-lg text-foreground">{title}</h2>
        <span className="text-sm text-muted-foreground">({shows.length})</span>
      </div>
      <div className="space-y-3">
        {shows.map((show) => (
          <div
            key={show.id}
            className={`
              relative overflow-hidden rounded-2xl bg-card/50 border ${borderColor}
              backdrop-blur-sm
            `}
            data-testid={`shared-show-${show.id}`}
          >
            <div className="flex">
              <div className="relative w-20 shrink-0 bg-muted">
                {show.imageUrl ? (
                  <img
                    src={show.imageUrl}
                    alt={show.title}
                    className="w-full h-full object-cover aspect-[2/3]"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] flex items-center justify-center bg-secondary text-muted-foreground">
                    <Tv className="w-6 h-6 opacity-20" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                <h3 className="font-display font-bold text-foreground line-clamp-1">
                  {show.title}
                </h3>
                <div className="mt-1 flex items-center gap-3">
                  <AiringIndicator show={show} />
                  <StarRating rating={show.rating} readOnly />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
