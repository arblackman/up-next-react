import { Play, Clock, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  const handleLogin = () => {
    setLocation("/sign-up");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="p-4 rounded-2xl mb-6 spectrum-icon">
          <Play className="w-12 h-12 text-black/80" fill="currentColor" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-center mb-4 spectrum-text">
          Up Next
        </h1>
        
        <p className="text-lg text-muted-foreground text-center max-w-md mb-8">
          Keep track of all your favorite shows. Organize what you're watching, plan what's next, and remember what you've finished.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mb-12">
          <Button
            onClick={handleLogin}
            className="flex-1 rounded-full h-12 text-base font-medium spectrum-button text-black/80 hover:text-black border-0"
            data-testid="button-login"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
          <div className="p-6 rounded-2xl bg-card/50 border border-white/5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
              <Play className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">Currently Watching</h3>
            <p className="text-sm text-muted-foreground">Track the shows you're actively enjoying</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card/50 border border-white/5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 mb-4">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">Up Next</h3>
            <p className="text-sm text-muted-foreground">Plan your watchlist for later</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card/50 border border-white/5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-4">
              <Check className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">Watch History</h3>
            <p className="text-sm text-muted-foreground">Keep a record of completed series</p>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-white/5">
        Powered by TVMaze
      </footer>
    </div>
  );
}
