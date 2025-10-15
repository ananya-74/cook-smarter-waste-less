import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const Insights = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    usedItems: 0,
    wastedItems: 0,
    activeItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all items
      const { data: allItems, error: allError } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id);

      if (allError) throw allError;

      const totalItems = allItems?.length || 0;
      const usedItems = allItems?.filter((item) => item.used_at).length || 0;
      const wastedItems = allItems?.filter((item) => item.discarded_at).length || 0;
      const activeItems = allItems?.filter((item) => !item.used_at && !item.discarded_at).length || 0;

      setStats({
        totalItems,
        usedItems,
        wastedItems,
        activeItems,
      });
    } catch (error: any) {
      toast.error("Failed to load insights");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const wasteRate = stats.totalItems > 0 ? ((stats.wastedItems / stats.totalItems) * 100).toFixed(1) : "0";
  const usageRate = stats.totalItems > 0 ? ((stats.usedItems / stats.totalItems) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4 md:pt-20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Usage Insights</h1>
          <p className="text-muted-foreground">Track your food consumption patterns</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-soft hover:shadow-medium transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Items Tracked</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalItems}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-medium transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
                  <Package className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.activeItems}</div>
                  <p className="text-xs text-muted-foreground mt-1">In your fridge</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-medium transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Items Used</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.usedItems}</div>
                  <p className="text-xs text-muted-foreground mt-1">{usageRate}% usage rate</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-medium transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Items Wasted</CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{stats.wastedItems}</div>
                  <p className="text-xs text-muted-foreground mt-1">{wasteRate}% waste rate</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Food Waste Analysis</CardTitle>
                <CardDescription>Your sustainability impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.wastedItems === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🌱</div>
                    <p className="text-lg font-semibold text-primary">Excellent work!</p>
                    <p className="text-muted-foreground mt-2">
                      You haven't wasted any food yet. Keep it up!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {stats.wastedItems} item{stats.wastedItems > 1 ? "s" : ""} wasted
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Focus on using items before they expire to reduce waste
                        </p>
                      </div>
                    </div>

                    {stats.usedItems > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-green-900 dark:text-green-100">
                            {stats.usedItems} item{stats.usedItems > 1 ? "s" : ""} successfully used
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Great job managing your food inventory!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Tips to Reduce Waste:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Check expiry dates regularly and prioritize items expiring soon</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Use the recipe suggestions feature to cook with items you have</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Plan your meals and shopping list to avoid overbuying</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Store food properly to extend its shelf life</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Insights;
