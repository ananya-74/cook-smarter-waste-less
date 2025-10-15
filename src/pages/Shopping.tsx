import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface ShoppingItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  purchased: boolean;
}

const Shopping = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShoppingList();
  }, []);

  const fetchShoppingList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("user_id", user.id)
        .order("purchased", { ascending: true })
        .order("added_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Failed to load shopping list");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItemName.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("shopping_list").insert({
        user_id: user.id,
        item_name: newItemName.trim(),
        quantity: parseFloat(newItemQty) || 1,
        unit: "piece",
        purchased: false,
      });

      if (error) throw error;

      toast.success("Item added!");
      setNewItemName("");
      setNewItemQty("1");
      fetchShoppingList();
    } catch (error: any) {
      toast.error("Failed to add item");
      console.error(error);
    }
  };

  const handleTogglePurchased = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("shopping_list")
        .update({
          purchased: !currentStatus,
          purchased_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq("id", itemId);

      if (error) throw error;

      fetchShoppingList();
    } catch (error: any) {
      toast.error("Failed to update item");
      console.error(error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("shopping_list")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item removed!");
      fetchShoppingList();
    } catch (error: any) {
      toast.error("Failed to delete item");
      console.error(error);
    }
  };

  const handleClearPurchased = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("shopping_list")
        .delete()
        .eq("user_id", user.id)
        .eq("purchased", true);

      if (error) throw error;

      toast.success("Purchased items cleared!");
      fetchShoppingList();
    } catch (error: any) {
      toast.error("Failed to clear items");
      console.error(error);
    }
  };

  const unpurchasedCount = items.filter((item) => !item.purchased).length;
  const purchasedCount = items.filter((item) => item.purchased).length;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4 md:pt-20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Shopping List</h1>
          <p className="text-muted-foreground">
            {unpurchasedCount} items to buy
            {purchasedCount > 0 && ` • ${purchasedCount} purchased`}
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="flex gap-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name..."
                className="flex-1"
              />
              <Input
                type="number"
                step="0.1"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                placeholder="Qty"
                className="w-20"
              />
              <Button type="submit" className="bg-gradient-primary">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Your list is empty</h3>
                <p className="text-muted-foreground">Add items you need to buy</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-2">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={`shadow-soft hover:shadow-medium transition-all ${
                    item.purchased ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="flex items-center gap-3 py-4">
                    <Checkbox
                      checked={item.purchased}
                      onCheckedChange={() => handleTogglePurchased(item.id, item.purchased)}
                    />
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          item.purchased ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.item_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {purchasedCount > 0 && (
              <Button
                variant="outline"
                onClick={handleClearPurchased}
                className="w-full"
              >
                Clear {purchasedCount} Purchased Item{purchasedCount > 1 ? "s" : ""}
              </Button>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Shopping;
