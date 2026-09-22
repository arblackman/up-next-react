import { useQuery } from "@tanstack/react-query";
import { type Show } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Star, AlertCircle, Loader2, ExternalLink } from "lucide-react";

interface ShowDetails {
  summary: string | null;
  genres: string[];
  network: string | null;
  premiered: string | null;
  runtime: number | null;
  language: string | null;
  officialSite: string | null;
  rating: number | null;
  weight: number | null;
}

interface ShowDetailModalProps {
  show: Show | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShowDetailModal({ show, open, onOpenChange }: ShowDetailModalProps) {
  const { data, isLoading, error } = useQuery<ShowDetails>({
    queryKey: ['/api/shows', show?.id, 'details'],
    enabled: open && !!show,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 max-h-[85vh] overflow-y-auto"
        data-testid="modal-show-detail"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display pr-6" data-testid="text-detail-title">
            {show?.title}
          </DialogTitle>
          <DialogDescription className="sr-only">Show details and ratings</DialogDescription>
        </DialogHeader>

        {!show ? null : (
          <div className="space-y-4">
            {show.imageUrl && (
              <div className="relative w-full rounded-xl overflow-hidden bg-muted">
                <img
                  src={show.imageUrl}
                  alt={show.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading details...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 py-4">
                <AlertCircle className="w-4 h-4" />
                Couldn't load show details. Please try again.
              </div>
            )}

            {data && (
              <>
                {(data.rating !== null || show.rating) && (
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {data.rating !== null && (
                      <div className="flex items-center gap-1.5" data-testid="text-tvmaze-rating">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-white">{data.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs">TVmaze</span>
                      </div>
                    )}
                    {show.rating && (
                      <div className="flex items-center gap-1.5" data-testid="text-your-rating">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="font-semibold text-white">{show.rating}/5</span>
                        <span className="text-muted-foreground text-xs">your rating</span>
                      </div>
                    )}
                  </div>
                )}

                {data.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {data.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-2.5 py-0.5 text-xs rounded-full bg-white/5 border border-white/10 text-muted-foreground"
                        data-testid={`badge-genre-${genre.toLowerCase()}`}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {data.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-summary">
                    {data.summary}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/10">
                  {data.network && (
                    <div>
                      <div className="text-muted-foreground">Network</div>
                      <div className="text-white font-medium">{data.network}</div>
                    </div>
                  )}
                  {data.premiered && (
                    <div>
                      <div className="text-muted-foreground">Premiered</div>
                      <div className="text-white font-medium">{data.premiered.split('-')[0]}</div>
                    </div>
                  )}
                  {data.runtime && (
                    <div>
                      <div className="text-muted-foreground">Runtime</div>
                      <div className="text-white font-medium">{data.runtime} min</div>
                    </div>
                  )}
                  {show.status && (
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="text-white font-medium">{show.status}</div>
                    </div>
                  )}
                </div>

                {data.officialSite && (
                  <a
                    href={data.officialSite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    data-testid="link-official-site"
                  >
                    Official site
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
