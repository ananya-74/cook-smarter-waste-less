import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string;
  notes?: string;
}

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("piece");
  const [category, setCategory] = useState("other");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id)
        .is("used_at", null)
        .is("discarded_at", null)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Failed to load inventory");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("inventory_items").insert([{
        user_id: user.id,
        name,
        quantity: parseFloat(quantity),
        unit,
        category: category as any,
        expiry_date: expiryDate,
        notes: notes || null,
      }]);

      if (error) throw error;

      toast.success("Item added successfully!");
      setIsAddDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to add item");
      console.error(error);
    }
  };

  const handleMarkAsUsed = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ used_at: new Date().toISOString() })
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item marked as used!");
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to update item");
      console.error(error);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ discarded_at: new Date().toISOString() })
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item removed!");
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to delete item");
      console.error(error);
    }
  };

  const resetForm = () => {
    setName("");
    setQuantity("1");
    setUnit("piece");
    setCategory("other");
    setExpiryDate("");
    setNotes("");
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      vegetables: "🥬",
      fruits: "🍎",
      dairy: "🥛",
      meat: "🥩",
      fish: "🐟",
      grains: "🌾",
      snacks: "🍿",
      beverages: "🥤",
      condiments: "🧂",
      other: "📦",
    };
    return emojis[category] || "📦";
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4 md:pt-20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fridge Inventory</h1>
            <p className="text-muted-foreground">Manage your food items</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>Add a new item to your fridge inventory</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Milk"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="g">Gram</SelectItem>
                        <SelectItem value="l">Liter</SelectItem>
                        <SelectItem value="ml">Milliliter</SelectItem>
                        <SelectItem value="cup">Cup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetables">Vegetables 🥬</SelectItem>
                      <SelectItem value="fruits">Fruits 🍎</SelectItem>
                      <SelectItem value="dairy">Dairy 🥛</SelectItem>
                      <SelectItem value="meat">Meat 🥩</SelectItem>
                      <SelectItem value="fish">Fish 🐟</SelectItem>
                      <SelectItem value="grains">Grains 🌾</SelectItem>
                      <SelectItem value="snacks">Snacks 🍿</SelectItem>
                      <SelectItem value="beverages">Beverages 🥤</SelectItem>
                      <SelectItem value="condiments">Condiments 🧂</SelectItem>
                      <SelectItem value="other">Other 📦</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date *</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary">
                  Add Item
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="text-6xl">🍽️</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No items yet</h3>
                <p className="text-muted-foreground">Start adding items to track your inventory</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const days = getDaysUntilExpiry(item.expiry_date);
              const isExpired = days < 0;
              const isExpiringSoon = days >= 0 && days <= 3;

              return (
                <Card
                  key={item.id}
                  className={`shadow-soft hover:shadow-medium transition-all ${
                    isExpired ? "border-destructive" : isExpiringSoon ? "border-warning" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                        <span className="text-lg">{item.name}</span>
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isExpired ? "text-destructive" : isExpiringSoon ? "text-warning" : "text-muted-foreground"
                        }`}
                      >
                        {isExpired ? "Expired" : days === 0 ? "Today" : `${days}d`}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Quantity:</span>{" "}
                        <span className="font-medium">
                          {item.quantity} {item.unit}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Expires:</span>{" "}
                        <span className="font-medium">{new Date(item.expiry_date).toLocaleDateString()}</span>
                      </p>
                      {item.notes && (
                        <p className="text-muted-foreground text-xs pt-2 italic">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleMarkAsUsed(item.id)}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Used
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Inventory;
