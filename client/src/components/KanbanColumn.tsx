import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Play, Clock, Check, ArrowUpDown } from "lucide-react";
import { DraggableShowCard } from "@/components/DraggableShowCard";
import { type Show } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortOption = "custom" | "a-z" | "z-a" | "status" | "next-airing" | "rating";

interface KanbanColumnProps {
  category: "watching" | "next" | "watched";
  shows: Show[];
  onUpdateStatus: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  onRefresh: (id: number) => void;
  onRatingChange: (id: number, rating: number | null) => void;
  onMoveToTop?: (id: number) => void;
  onMoveToBottom?: (id: number) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const categoryConfig = {
  watching: {
    label: "Watching",
    icon: Play,
    color: "text-green-500",
    bgColor: "bg-green-500/20",
  },
  next: {
    label: "Up Next",
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-500/20",
  },
  watched: {
    label: "History",
    icon: Check,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
  },
};

const sortLabels: Record<SortOption, string> = {
  "custom": "Custom",
  "a-z": "A \u2192 Z",
  "z-a": "Z \u2192 A",
  "status": "Status",
  "next-airing": "Next Airing",
  "rating": "Rating",
};

export function KanbanColumn({ 
  category, 
  shows, 
  onUpdateStatus, 
  onDelete,
  onRefresh,
  onRatingChange,
  onMoveToTop,
  onMoveToBottom,
  sortOption,
  onSortChange,
}: KanbanColumnProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  const isCustomSort = sortOption === "custom";
  
  const { setNodeRef, isOver } = useDroppable({
    id: category,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        flex flex-col h-full overflow-y-auto rounded-xl transition-colors duration-200
        ${isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-transparent'}
      `}
    >
      <div className="sticky top-0 z-10 flex items-center gap-2 py-2 px-2 bg-background">
        <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <h2 className="font-display font-semibold text-foreground">{config.label}</h2>
        <span className="text-sm text-muted-foreground">({shows.length})</span>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-xs gap-1 rounded-lg ${!isCustomSort ? 'text-primary' : 'text-muted-foreground'}`}
                data-testid={`button-sort-${category}`}
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{sortLabels[sortOption]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => onSortChange(opt)}
                  className={sortOption === opt ? "bg-accent text-accent-foreground font-medium" : ""}
                  data-testid={`sort-option-${opt}-${category}`}
                >
                  {sortLabels[opt]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 px-2 pb-2">
        <SortableContext items={shows.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {shows.length === 0 ? (
            <div className={`
              text-center py-12 px-4 text-muted-foreground/50 text-sm
              border-2 border-dashed rounded-xl transition-colors
              ${isOver ? 'border-primary/50' : 'border-white/5'}
            `}>
              {isOver ? 'Drop here' : 'No shows'}
            </div>
          ) : (
            shows.map((show) => (
              <DraggableShowCard
                key={show.id}
                show={show}
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
                onRefresh={onRefresh}
                onRatingChange={onRatingChange}
                onMoveToTop={isCustomSort ? onMoveToTop : undefined}
                onMoveToBottom={isCustomSort ? onMoveToBottom : undefined}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
