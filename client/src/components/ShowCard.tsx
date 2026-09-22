import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { type Show } from "@shared/schema";
import { Play, Check, Clock, Trash2, AlertCircle, RefreshCw, ArrowUp, ArrowDown, Info } from "lucide-react";
import { ShowDetailModal } from "@/components/ShowDetailModal";
import { Button } from "@/components/ui/button";
import { AiringIndicator } from "@/components/AiringIndicator";
import { StarRating } from "@/components/StarRating";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShowCardProps {
  show: Show;
  onUpdateStatus: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  onRefresh: (id: number) => void;
  onRatingChange: (id: number, rating: number | null) => void;
  onMoveToTop?: (id: number) => void;
  onMoveToBottom?: (id: number) => void;
  disableDrag?: boolean;
}

export function ShowCard({ show, onUpdateStatus, onDelete, onRefresh, onRatingChange, onMoveToTop, onMoveToBottom, disableDrag }: ShowCardProps) {
  const dragControls = useDragControls();
  const [detailOpen, setDetailOpen] = useState(false);

  const cardContent = (
    <div
      className="
        relative overflow-hidden rounded-2xl bg-card border border-white/5
        shadow-lg shadow-black/20 hover:shadow-black/40 hover:border-primary/20
        transition-all duration-300
      "
    >
      <div className="flex h-20 sm:h-24">
        {/* Image area — acts as the drag handle on touch devices */}
        <div
          className="relative w-20 sm:w-24 shrink-0 bg-muted cursor-grab active:cursor-grabbing"
          style={{ touchAction: disableDrag ? 'auto' : 'none' }}
          onPointerDown={disableDrag ? undefined : (e) => {
            dragControls.start(e);
          }}
        >
          {show.imageUrl ? (
            <img
              src={show.imageUrl}
              alt={show.title}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground pointer-events-none">
              <AlertCircle className="w-8 h-8 opacity-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
          {/* Subtle drag hint dots */}
          {!disableDrag && (
            <div className="absolute bottom-1.5 right-1.5 flex flex-col gap-0.5 pointer-events-none opacity-40">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
              </div>
              <div className="flex gap-0.5">
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
              </div>
              <div className="flex gap-0.5">
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
          <h3 className="font-display font-bold text-base sm:text-lg leading-tight text-white line-clamp-2">
            {show.title}
          </h3>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <AiringIndicator show={show} />
              <StarRating
                rating={show.rating}
                onChange={(rating) => onRatingChange(show.id, rating)}
                size="sm"
                showTitle={show.title}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-white/10" onClick={(e) => e.stopPropagation()}>
                  <span className="sr-only">Open menu</span>
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-xl border-white/10 w-48">
                <DropdownMenuLabel>Move to...</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                
                {show.category !== 'watching' && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(show.id, 'watching')}>
                    <Play className="w-4 h-4 mr-2 text-green-500" />
                    Watching Now
                  </DropdownMenuItem>
                )}
                {show.category !== 'next' && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(show.id, 'next')}>
                    <Clock className="w-4 h-4 mr-2 text-amber-500" />
                    Watch Next
                  </DropdownMenuItem>
                )}
                {show.category !== 'watched' && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(show.id, 'watched')}>
                    <Check className="w-4 h-4 mr-2 text-primary" />
                    Watched
                  </DropdownMenuItem>
                )}
                
                {(onMoveToTop || onMoveToBottom) && (
                  <DropdownMenuSeparator className="bg-white/10" />
                )}
                {onMoveToTop && (
                  <DropdownMenuItem onClick={() => onMoveToTop(show.id)}>
                    <ArrowUp className="w-4 h-4 mr-2 text-muted-foreground" />
                    Move to Top
                  </DropdownMenuItem>
                )}
                {onMoveToBottom && (
                  <DropdownMenuItem onClick={() => onMoveToBottom(show.id)}>
                    <ArrowDown className="w-4 h-4 mr-2 text-muted-foreground" />
                    Move to Bottom
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => setDetailOpen(true)} data-testid={`button-show-details-${show.id}`}>
                  <Info className="w-4 h-4 mr-2 text-primary" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRefresh(show.id)}>
                  <RefreshCw className="w-4 h-4 mr-2 text-primary" />
                  Refresh Status
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(show.id)}
                  className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Show
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  const modal = <ShowDetailModal show={show} open={detailOpen} onOpenChange={setDetailOpen} />;

  if (disableDrag) {
    return (
      <div className="relative mb-4 select-none">
        {cardContent}
        {modal}
      </div>
    );
  }

  return (
    <>
      <Reorder.Item
        value={show}
        id={String(show.id)}
        className="relative mb-4 group select-none"
        whileDrag={{ scale: 1.02, zIndex: 50 }}
        dragListener={false}
        dragControls={dragControls}
      >
        {cardContent}
      </Reorder.Item>
      {modal}
    </>
  );
}
