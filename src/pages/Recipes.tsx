import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Loader2, Clock, Users } from "lucide-react";
import { toast } from "sonner";

interface Recipe {
  title: string;
  description: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
}

const Recipes = () => {
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchAvailableIngredients();
  }, []);

  const fetchAvailableIngredients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("inventory_items")
        .select("name")
        .eq("user_id", user.id)
        .is("used_at", null)
        .is("discarded_at", null);

      if (error) throw error;

      const ingredients = data.map((item) => item.name);
      setAvailableIngredients(ingredients);
    } catch (error: any) {
      console.error(error);
    }
  };

  const getSuggestedRecipes = async () => {
    if (availableIngredients.length === 0) {
      toast.error("Please add some items to your inventory first");
      return;
    }

    setLoading(true);
    setHasLoaded(true);

    try {
      const { data, error } = await supabase.functions.invoke("get-recipes", {
        body: { ingredients: availableIngredients },
      });

      if (error) throw error;

      setRecipes(data.recipes || []);
      
      if (data.recipes.length === 0) {
        toast.info("No recipes found. Try adding more ingredients!");
      }
    } catch (error: any) {
      toast.error("Failed to get recipe suggestions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4 md:pt-20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Recipe Suggestions</h1>
          <p className="text-muted-foreground">
            AI-powered recipes based on your ingredients
          </p>
        </div>

        {availableIngredients.length > 0 && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Available Ingredients</CardTitle>
              <CardDescription>
                {availableIngredients.length} items in your fridge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableIngredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-lighter text-primary rounded-full text-sm font-medium"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
              <Button
                onClick={getSuggestedRecipes}
                disabled={loading}
                className="w-full mt-4 bg-gradient-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding recipes...
                  </>
                ) : (
                  <>
                    <ChefHat className="mr-2 h-4 w-4" />
                    Get Recipe Suggestions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {!hasLoaded && availableIngredients.length === 0 && (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <ChefHat className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No ingredients yet</h3>
                <p className="text-muted-foreground">
                  Add items to your inventory to get personalized recipe suggestions
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {recipes.length > 0 && (
          <div className="space-y-6">
            {recipes.map((recipe, index) => (
              <Card key={index} className="shadow-medium">
                <CardHeader>
                  <CardTitle className="text-2xl">{recipe.title}</CardTitle>
                  <CardDescription>{recipe.description}</CardDescription>
                  <div className="flex gap-4 text-sm text-muted-foreground pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {recipe.cookTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {recipe.servings}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-primary">Ingredients:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {recipe.ingredients.map((ingredient, i) => (
                        <li key={i} className="text-sm">
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-primary">Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-2">
                      {recipe.instructions.map((instruction, i) => (
                        <li key={i} className="text-sm">
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Recipes;
