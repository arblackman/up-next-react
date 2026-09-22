import { format, isToday, isTomorrow, differenceInDays, parseISO } from "date-fns";

interface AiringIndicatorShow {
  status: string | null;
  nextEpisodeNumber: number | null;
  latestSeasonEpisodeCount: number | null;
  latestSeasonNumber: number | null;
  nextEpisodeDate: string | null;
}

interface AiringIndicatorProps {
  show: AiringIndicatorShow;
}

function formatAirDate(dateString: string | null): string | null {
  if (!dateString) return null;
  
  try {
    const date = parseISO(dateString);
    const now = new Date();
    
    if (isToday(date)) {
      return "Today";
    }
    if (isTomorrow(date)) {
      return "Tomorrow";
    }
    
    const daysAway = differenceInDays(date, now);
    if (daysAway > 0 && daysAway <= 7) {
      return format(date, "EEEE");
    }
    
    return format(date, "MMM d");
  } catch {
    return null;
  }
}

export function AiringIndicator({ show }: AiringIndicatorProps) {
  const { status, nextEpisodeNumber, latestSeasonEpisodeCount, latestSeasonNumber, nextEpisodeDate } = show;
  
  const seasonPrefix = latestSeasonNumber ? `S${latestSeasonNumber} ` : "";
  
  if (status === "Ended") {
    const episodeText = latestSeasonEpisodeCount 
      ? `${latestSeasonEpisodeCount} eps`
      : null;
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
        <span className="text-xs font-medium text-muted-foreground/60">
          Ended
        </span>
        {episodeText && (
          <span className="text-xs text-muted-foreground/50">
            ({episodeText})
          </span>
        )}
      </div>
    );
  }
  
  if (nextEpisodeNumber && nextEpisodeNumber > 1) {
    const availableEpisodes = nextEpisodeNumber - 1;
    const episodeText = latestSeasonEpisodeCount 
      ? `${availableEpisodes}/${latestSeasonEpisodeCount} eps`
      : `${availableEpisodes} eps`;
    const airDateText = formatAirDate(nextEpisodeDate);
    
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-xs font-medium text-blue-400">
            {seasonPrefix}In Progress
          </span>
          <span className="text-xs text-muted-foreground">
            ({episodeText})
          </span>
        </div>
        {airDateText && (
          <span className="text-xs text-muted-foreground/70 ml-4">
            Next: {airDateText}
          </span>
        )}
      </div>
    );
  }
  
  if (nextEpisodeNumber === 1) {
    const airDateText = formatAirDate(nextEpisodeDate);
    
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="text-xs font-medium text-amber-400">
            {seasonPrefix}Coming Soon
          </span>
        </div>
        {airDateText && (
          <span className="text-xs text-muted-foreground/70 ml-4">
            Premieres: {airDateText}
          </span>
        )}
      </div>
    );
  }
  
  if (!nextEpisodeNumber && status !== "Ended") {
    const episodeText = latestSeasonEpisodeCount 
      ? `${latestSeasonEpisodeCount} eps`
      : null;
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        <span className="text-xs font-medium text-green-400">
          {seasonPrefix}Available
        </span>
        {episodeText && (
          <span className="text-xs text-muted-foreground">
            ({episodeText})
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
      <span className="text-xs font-medium text-muted-foreground/50">
        {status || "Unknown"}
      </span>
    </div>
  );
}
