import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Plus, ChefHat } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string;
}

const Dashboard = () => {
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get items expiring in next 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { data: expiring, error: expiringError } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id)
        .is("used_at", null)
        .is("discarded_at", null)
        .lte("expiry_date", threeDaysFromNow.toISOString().split("T")[0])
        .order("expiry_date", { ascending: true });

      if (expiringError) throw expiringError;

      const { count, error: countError } = await supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("used_at", null)
        .is("discarded_at", null);

      if (countError) throw countError;

      setExpiringItems(expiring || []);
      setTotalItems(count || 0);
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4 md:pt-20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Welcome to SmartKitchen
          </h1>
          <p className="text-muted-foreground">
            Reduce food waste, cook smarter, save money
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">In your fridge</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{expiringItems.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Next 3 days</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">-</div>
              <p className="text-xs text-muted-foreground mt-1">Items saved</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/inventory">
            <Button className="w-full h-24 flex-col space-y-2 bg-gradient-primary hover:opacity-90">
              <Plus className="h-6 w-6" />
              <span className="text-sm">Add Item</span>
            </Button>
          </Link>
          <Link to="/recipes">
            <Button className="w-full h-24 flex-col space-y-2" variant="secondary">
              <ChefHat className="h-6 w-6" />
              <span className="text-sm">Find Recipe</span>
            </Button>
          </Link>
          <Link to="/shopping">
            <Button className="w-full h-24 flex-col space-y-2" variant="outline">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">Shopping</span>
            </Button>
          </Link>
          <Link to="/insights">
            <Button className="w-full h-24 flex-col space-y-2" variant="outline">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Insights</span>
            </Button>
          </Link>
        </div>

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <Card className="border-warning shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Items Expiring Soon
              </CardTitle>
              <CardDescription>Use these items first to reduce waste</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringItems.slice(0, 5).map((item) => {
                  const days = getDaysUntilExpiry(item.expiry_date);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-warning-light rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit} • {item.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${days < 1 ? "text-destructive" : "text-warning"}`}>
                          {days < 0 ? "Expired" : days === 0 ? "Today" : `${days}d`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {expiringItems.length > 5 && (
                <Link to="/inventory">
                  <Button variant="link" className="w-full mt-3">
                    View all {expiringItems.length} items
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && totalItems === 0 && (
          <Card className="text-center py-12 shadow-soft">
            <CardContent className="space-y-4">
              <Package className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Your fridge is empty</h3>
                <p className="text-muted-foreground mb-4">
                  Start adding items to track expiry dates and get recipe suggestions
                </p>
                <Link to="/inventory">
                  <Button className="bg-gradient-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Item
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
