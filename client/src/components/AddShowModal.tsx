import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Play, Clock, Check } from "lucide-react";
import { useSearchShows, useCreateShow, useShows } from "@/hooks/use-shows";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";

interface AddShowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
}

const categoryOptions = [
  { value: "watching", label: "Watching", icon: Play, color: "text-green-500", bgColor: "bg-green-500/20" },
  { value: "next", label: "Up Next", icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/20" },
  { value: "watched", label: "History", icon: Check, color: "text-purple-500", bgColor: "bg-purple-500/20" },
];

export function AddShowModal({ open, onOpenChange, defaultCategory = "next" }: AddShowModalProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const debouncedQuery = useDebounce(query, 500);
  const { data: results, isLoading } = useSearchShows(debouncedQuery);
  const { mutate: createShow, isPending: isCreating } = useCreateShow();
  const { data: existingShows } = useShows();

  useEffect(() => {
    if (!open) {
      setQuery("");
    } else {
      setSelectedCategory(defaultCategory);
    }
  }, [open, defaultCategory]);

  const handleAdd = (show: any) => {
    createShow({
      title: show.title,
      apiId: show.apiId,
      imageUrl: show.imageUrl || null,
      category: selectedCategory,
      priority: 0,
    }, {
      onSuccess: () => {
        setQuery("");
      }
    });
  };

  const isAlreadyAdded = (apiId: number) => {
    return existingShows?.some(s => s.apiId === apiId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden gap-0 top-[5%] translate-y-0 data-[state=open]:slide-in-from-top-2">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Add TV Show</DialogTitle>
            <DialogDescription>
              Search for a show to add to your list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="hidden lg:flex gap-1 mt-4 p-1 bg-secondary/50 rounded-lg" data-testid="category-selector">
            {categoryOptions.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-card shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`category-${cat.value}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? cat.color : ''}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search TV Maze..."
              className="pl-10 h-11 bg-secondary/50 border-transparent focus:border-primary/50 text-base"
              autoFocus
              data-testid="input-search-shows"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading && query.length >= 2 ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-1">
              {results.map((show) => {
                const added = isAlreadyAdded(show.apiId);
                
                return (
                  <div
                    key={show.apiId}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="h-16 w-12 bg-muted rounded overflow-hidden shrink-0">
                      {show.imageUrl ? (
                        <img src={show.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-secondary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{show.title}</h4>
                      {show.year && (
                        <p className="text-sm text-muted-foreground">{show.year}</p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant={added ? "secondary" : "default"}
                      disabled={added || isCreating}
                      onClick={() => handleAdd(show)}
                      className={added ? "opacity-50" : ""}
                      data-testid={`button-add-${show.apiId}`}
                    >
                      {added ? (
                        "Added"
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-12 text-center text-muted-foreground">
              No shows found for "{query}"
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground/50 text-sm">
              Type to start searching...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
