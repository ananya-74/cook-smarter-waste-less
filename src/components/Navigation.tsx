import { Home, Package, ChefHat, ShoppingCart, BarChart3, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Package, label: "Inventory", path: "/inventory" },
    { icon: ChefHat, label: "Recipes", path: "/recipes" },
    { icon: ShoppingCart, label: "Shopping", path: "/shopping" },
    { icon: BarChart3, label: "Insights", path: "/insights" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:top-0 md:bottom-auto md:border-b md:border-t-0 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="hidden md:flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">SmartKitchen</span>
          </div>
          
          <div className="flex items-center justify-around w-full md:justify-end md:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex flex-col md:flex-row items-center gap-1 h-auto py-2 px-3 transition-all",
                      isActive && "bg-primary-lighter text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs md:text-sm">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex flex-col md:flex-row items-center gap-1 h-auto py-2 px-3"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs md:text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
