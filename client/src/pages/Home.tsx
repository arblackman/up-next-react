import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { Play, Clock, Check, Plus, LogOut, AlertCircle, RefreshCw, Share2, Copy, CheckCircle2, ArrowUpDown } from "lucide-react";
import { useShows, useUpdateShow, useDeleteShow, useRefreshStatus, useRefreshShow } from "@/hooks/use-shows";
import { useClerk, useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ShowCard } from "@/components/ShowCard";
import { KanbanColumn, type SortOption } from "@/components/KanbanColumn";
import { AddShowModal } from "@/components/AddShowModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type Show } from "@shared/schema";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Home() {
  const [activeTab, setActiveTab] = useState("watching");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoadingShare, setIsLoadingShare] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { data: shows, isLoading, error } = useShows();
  const { mutate: updateShow } = useUpdateShow();
  const { mutate: deleteShow } = useDeleteShow();
  const { mutate: refreshStatus, isPending: isRefreshing } = useRefreshStatus();
  const { mutate: refreshShow } = useRefreshShow();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleShareClick = async () => {
    setIsShareDialogOpen(true);
    setIsLoadingShare(true);
    setHasCopied(false);
    try {
      const response = await apiRequest("GET", "/api/share/token");
      const data = await response.json();
      const url = `${window.location.origin}${basePath}/shared/${data.shareToken}`;
      setShareUrl(url);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not get share link. Please try again.",
      });
      setIsShareDialogOpen(false);
    } finally {
      setIsLoadingShare(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your friends.",
      });
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the link manually.",
      });
    }
  };
  
  const handleRefreshShow = (id: number) => {
    refreshShow(id, {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Refresh failed",
          description: "Could not fetch show details. Please try again.",
        });
      },
    });
  };

  const counts = {
    watching: shows?.filter(s => s.category === "watching").length || 0,
    next: shows?.filter(s => s.category === "next").length || 0,
    watched: shows?.filter(s => s.category === "watched").length || 0,
  };

  const [localShows, setLocalShows] = useState<Show[]>([]);
  const [hasAutoRefreshed, setHasAutoRefreshed] = useState(false);
  const [sortOptions, setSortOptions] = useState<Record<string, SortOption>>({
    watching: "custom",
    next: "custom",
    watched: "custom",
  });

  const handleSortChange = (category: string, sort: SortOption) => {
    setSortOptions(prev => ({ ...prev, [category]: sort }));
  };

  useEffect(() => {
    if (shows) {
      setLocalShows(shows.sort((a, b) => a.priority - b.priority));
    }
  }, [shows]);

  useEffect(() => {
    if (shows && shows.length > 0 && !hasAutoRefreshed && !isRefreshing) {
      setHasAutoRefreshed(true);
      refreshStatus();
    }
  }, [shows, hasAutoRefreshed, isRefreshing, refreshStatus]);

  const getVisualStatus = (show: Show): number => {
    if (show.status === "Ended") return 4;
    if (show.nextEpisodeNumber && show.nextEpisodeNumber > 1) return 0; // In Progress
    if (show.nextEpisodeNumber === 1) return 1; // Coming Soon
    if (!show.nextEpisodeNumber && show.status !== "Ended") return 2; // Complete (season)
    return 3; // Unknown
  };

  const sortShows = (showsList: Show[], sort: SortOption): Show[] => {
    if (sort === "custom") return showsList;
    const sorted = [...showsList];
    switch (sort) {
      case "a-z":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "z-a":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case "status":
        return sorted.sort((a, b) => getVisualStatus(a) - getVisualStatus(b));
      case "next-airing":
        return sorted.sort((a, b) => {
          if (!a.nextEpisodeDate && !b.nextEpisodeDate) return 0;
          if (!a.nextEpisodeDate) return 1;
          if (!b.nextEpisodeDate) return -1;
          return new Date(a.nextEpisodeDate).getTime() - new Date(b.nextEpisodeDate).getTime();
        });
      case "rating":
        return sorted.sort((a, b) => {
          if (!a.rating && !b.rating) return 0;
          if (!a.rating) return 1;
          if (!b.rating) return -1;
          return b.rating - a.rating;
        });
      default:
        return sorted;
    }
  };

  const getShowsByCategory = (category: string) => {
    const categoryShows = localShows.filter(show => show.category === category);
    return sortShows(categoryShows, sortOptions[category] || "custom");
  };

  const filteredShows = getShowsByCategory(activeTab);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleReorder = (newOrder: Show[], category?: string) => {
    const cat = category || activeTab;
    const otherShows = localShows.filter(show => show.category !== cat);
    const fullList = [...otherShows, ...newOrder];
    
    setLocalShows(fullList);
    
    newOrder.forEach((show, index) => {
      if (show.priority !== index) {
        updateShow({ id: show.id, priority: index });
      }
    });
  };

  const handleUpdateStatus = (id: number, status: string) => {
    updateShow({ id, category: status });
  };

  const handleRatingChange = (id: number, rating: number | null) => {
    updateShow({ id, rating });
  };

  const handleMoveToTop = (id: number) => {
    const show = localShows.find(s => s.id === id);
    if (!show) return;
    
    const categoryShows = getShowsByCategory(show.category);
    const currentIndex = categoryShows.findIndex(s => s.id === id);
    if (currentIndex <= 0) return;
    
    const newOrder = [categoryShows[currentIndex], ...categoryShows.filter(s => s.id !== id)];
    handleReorder(newOrder, show.category);
  };

  const handleMoveToBottom = (id: number) => {
    const show = localShows.find(s => s.id === id);
    if (!show) return;
    
    const categoryShows = getShowsByCategory(show.category);
    const currentIndex = categoryShows.findIndex(s => s.id === id);
    if (currentIndex === categoryShows.length - 1) return;
    
    const newOrder = [...categoryShows.filter(s => s.id !== id), categoryShows[currentIndex]];
    handleReorder(newOrder, show.category);
  };

  // dnd-kit handlers for kanban drag-and-drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeShow = localShows.find(s => s.id === active.id);
    if (!activeShow) return;

    // Check if dropping over a column or another item
    const overCategory = typeof over.id === 'string' && ['watching', 'next', 'watched'].includes(over.id as string)
      ? over.id as string
      : localShows.find(s => s.id === over.id)?.category;

    if (overCategory && activeShow.category !== overCategory) {
      // Move to new category optimistically
      setLocalShows(prev => 
        prev.map(show => 
          show.id === active.id 
            ? { ...show, category: overCategory } 
            : show
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeShow = localShows.find(s => s.id === active.id);
    if (!activeShow) return;

    // Determine target category
    const targetCategory = typeof over.id === 'string' && ['watching', 'next', 'watched'].includes(over.id as string)
      ? over.id as string
      : localShows.find(s => s.id === over.id)?.category || activeShow.category;

    // If reordering within same category
    if (active.id !== over.id) {
      const categoryShows = getShowsByCategory(targetCategory);
      const oldIndex = categoryShows.findIndex(s => s.id === active.id);
      const newIndex = categoryShows.findIndex(s => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(categoryShows, oldIndex, newIndex);
        handleReorder(newOrder, targetCategory);
      }
    }

    // Update category if changed
    const originalShow = shows?.find(s => s.id === active.id);
    if (originalShow && originalShow.category !== targetCategory) {
      updateShow({ id: active.id as number, category: targetCategory });
    }
  };

  const activeShow = activeId ? localShows.find(s => s.id === activeId) : null;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3 lg:mb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl spectrum-icon">
                <Play className="w-6 h-6 text-black/80" fill="currentColor" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold spectrum-text">
                Up Next
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="rounded-full spectrum-button border-0 h-9 w-9 p-0 md:w-auto md:px-4 md:gap-2"
                data-testid="button-add-show"
              >
                <Plus className="w-5 h-5 text-black/80" />
                <span className="hidden md:inline text-black/80 font-medium">Add</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background" data-testid="button-avatar-menu">
                    <Avatar className="h-9 w-9 border border-white/10 cursor-pointer">
                        <AvatarImage src={user?.imageUrl || undefined} alt={user?.firstName || "User"} />
                      <AvatarFallback className="bg-secondary text-muted-foreground text-sm">
                         {user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.firstName || "User"}</p>
                       <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => refreshStatus()}
                    disabled={isRefreshing}
                    data-testid="menu-refresh-status"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh All
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleShareClick}
                    data-testid="menu-share-list"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share List
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem
                     onClick={() => setLocation("/profile")}
                     data-testid="menu-profile"
                   >
                     Profile
                   </DropdownMenuItem>
                  <DropdownMenuItem 
                     onClick={() => signOut({ redirectUrl: basePath || "/" })}
                    data-testid="menu-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tabs - only visible on smaller screens */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SegmentedControl
                  value={activeTab}
                  onChange={setActiveTab}
                  options={[
                    { value: "watching", label: "Watching", icon: <Play className="w-4 h-4" />, count: counts.watching },
                    { value: "next", label: "Up Next", icon: <Clock className="w-4 h-4" />, count: counts.next },
                    { value: "watched", label: "History", icon: <Check className="w-4 h-4" />, count: counts.watched },
                  ]}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`shrink-0 rounded-xl ${sortOptions[activeTab] !== "custom" ? "text-primary" : "text-muted-foreground"}`}
                    data-testid="button-sort-mobile"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {(["custom", "a-z", "z-a", "status", "next-airing", "rating"] as SortOption[]).map((opt) => (
                    <DropdownMenuItem
                      key={opt}
                      onClick={() => handleSortChange(activeTab, opt)}
                      className={sortOptions[activeTab] === opt ? "bg-accent text-accent-foreground font-medium" : ""}
                      data-testid={`sort-option-mobile-${opt}`}
                    >
                      {{ "custom": "Custom", "a-z": "A \u2192 Z", "z-a": "Z \u2192 A", "status": "Status", "next-airing": "Next Airing", "rating": "Rating" }[opt]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet View - Single Column with Tabs */}
      <main className="lg:hidden max-w-2xl mx-auto px-4 pt-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-card/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20">
            <p>Failed to load shows. Please try again.</p>
          </div>
        ) : filteredShows.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <Play className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-display font-medium text-foreground mb-2">No shows here yet</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
              Start tracking your TV journey by adding some shows to your list.
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-full">
              Add a Show
            </Button>
          </div>
        ) : sortOptions[activeTab] !== "custom" ? (
          <div className="space-y-4">
            {filteredShows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onUpdateStatus={handleUpdateStatus}
                onDelete={(id) => deleteShow(id)}
                onRefresh={handleRefreshShow}
                onRatingChange={handleRatingChange}
                disableDrag
              />
            ))}
          </div>
        ) : (
          <Reorder.Group axis="y" values={filteredShows} onReorder={(newOrder) => handleReorder(newOrder)}>
            {filteredShows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onUpdateStatus={handleUpdateStatus}
                onDelete={(id) => deleteShow(id)}
                onRefresh={handleRefreshShow}
                onRatingChange={handleRatingChange}
                onMoveToTop={handleMoveToTop}
                onMoveToBottom={handleMoveToBottom}
              />
            ))}
          </Reorder.Group>
        )}
      </main>

      {/* Desktop/Large Tablet View - Three Column Kanban */}
      <main className="hidden lg:block max-w-7xl mx-auto px-4 pt-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((col) => (
              <div key={col} className="space-y-4">
                <div className="h-8 bg-card/30 rounded-lg animate-pulse w-32" />
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-card/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20">
            <p>Failed to load shows. Please try again.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-3 gap-6 h-[calc(100vh-120px)]">
              <KanbanColumn
                category="watching"
                shows={getShowsByCategory("watching")}
                onUpdateStatus={handleUpdateStatus}
                onDelete={(id) => deleteShow(id)}
                onRefresh={handleRefreshShow}
                onRatingChange={handleRatingChange}
                onMoveToTop={sortOptions.watching === "custom" ? handleMoveToTop : undefined}
                onMoveToBottom={sortOptions.watching === "custom" ? handleMoveToBottom : undefined}
                sortOption={sortOptions.watching}
                onSortChange={(sort) => handleSortChange("watching", sort)}
              />
              <KanbanColumn
                category="next"
                shows={getShowsByCategory("next")}
                onUpdateStatus={handleUpdateStatus}
                onDelete={(id) => deleteShow(id)}
                onRefresh={handleRefreshShow}
                onRatingChange={handleRatingChange}
                onMoveToTop={sortOptions.next === "custom" ? handleMoveToTop : undefined}
                onMoveToBottom={sortOptions.next === "custom" ? handleMoveToBottom : undefined}
                sortOption={sortOptions.next}
                onSortChange={(sort) => handleSortChange("next", sort)}
              />
              <KanbanColumn
                category="watched"
                shows={getShowsByCategory("watched")}
                onUpdateStatus={handleUpdateStatus}
                onDelete={(id) => deleteShow(id)}
                onRefresh={handleRefreshShow}
                onRatingChange={handleRatingChange}
                onMoveToTop={sortOptions.watched === "custom" ? handleMoveToTop : undefined}
                onMoveToBottom={sortOptions.watched === "custom" ? handleMoveToBottom : undefined}
                sortOption={sortOptions.watched}
                onSortChange={(sort) => handleSortChange("watched", sort)}
              />
            </div>

            {/* Drag overlay for visual feedback */}
            <DragOverlay>
              {activeShow ? (
                <div className="
                  relative overflow-hidden rounded-2xl bg-card border border-primary/30
                  shadow-xl shadow-primary/20 w-80
                ">
                  <div className="flex h-24">
                    <div className="relative w-24 shrink-0 bg-muted">
                      {activeShow.imageUrl ? (
                        <img
                          src={activeShow.imageUrl}
                          alt={activeShow.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                          <AlertCircle className="w-8 h-8 opacity-20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex items-center">
                      <h3 className="font-display font-bold text-lg text-white line-clamp-2">
                        {activeShow.title}
                      </h3>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      <AddShowModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        defaultCategory={activeTab}
      />

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your List
            </DialogTitle>
            <DialogDescription>
              Anyone with this link can view your watchlist (read-only).
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            {isLoadingShare ? (
              <div className="flex-1 h-10 bg-muted animate-pulse rounded-md" />
            ) : (
              <Input
                value={shareUrl || ""}
                readOnly
                className="flex-1"
                data-testid="input-share-url"
              />
            )}
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopyLink}
              disabled={isLoadingShare || !shareUrl}
              data-testid="button-copy-share-link"
            >
              {hasCopied ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
