import { Star } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface StarRatingProps {
  rating: number | null;
  onChange?: (rating: number | null) => void;
  size?: "sm" | "md";
  readOnly?: boolean;
  showTitle?: string;
}

export function StarRating({ rating, onChange, size = "sm", readOnly = false, showTitle }: StarRatingProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleCardClick = (e: React.MouseEvent) => {
    if (readOnly || !onChange) return;
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleStarClick = (star: number) => {
    if (!onChange) return;
    if (rating === star) {
      onChange(null);
    } else {
      onChange(star);
    }
    setIsModalOpen(false);
  };

  if (readOnly && !rating) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleCardClick}
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex items-center gap-0.5 text-xs shrink-0 ${readOnly ? '' : 'cursor-pointer hover:opacity-80'} transition-opacity`}
        disabled={readOnly}
        data-testid="star-rating"
      >
        {rating ? (
          <>
            <span className="text-amber-400 font-medium">{rating}</span>
            <span>⭐</span>
          </>
        ) : !readOnly ? (
          <Star className="w-3.5 h-3.5 text-muted-foreground/40" />
        ) : null}
      </button>

      {!readOnly && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-xs bg-card/95 backdrop-blur-xl border-white/10 p-6" onPointerDown={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle className="text-lg font-display text-center">Rate "{showTitle}"</DialogTitle>
              <DialogDescription className="text-center text-sm">
                {rating ? "Tap the same star to remove your rating" : "Tap a star to set your rating"}
              </DialogDescription>
            </DialogHeader>
            <div
              className="flex items-center justify-center gap-2 py-4"
              onMouseLeave={() => setHoverRating(null)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const displayRating = hoverRating ?? rating ?? 0;
                return (
                  <button
                    key={star}
                    type="button"
                    className="cursor-pointer hover:scale-125 transition-transform p-1"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    data-testid={`star-${star}`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= displayRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground/30"
                      } transition-colors`}
                    />
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}