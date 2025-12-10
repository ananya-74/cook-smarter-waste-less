import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { ingredients } = body;

    // Input validation
    if (!ingredients || !Array.isArray(ingredients)) {
      console.error('Invalid ingredients: not an array');
      return new Response(JSON.stringify({ error: 'Invalid ingredients format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (ingredients.length === 0 || ingredients.length > 50) {
      console.error('Invalid ingredients: length out of bounds', ingredients.length);
      return new Response(JSON.stringify({ error: 'Ingredients must be between 1 and 50 items' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize ingredients: ensure strings, limit length, remove dangerous characters
    const sanitizedIngredients = ingredients
      .map(item => String(item).slice(0, 100).replace(/[<>{}]/g, ''))
      .filter(item => item.trim().length > 0);

    if (sanitizedIngredients.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid ingredients provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Create 2-3 simple recipes using these ingredients: ${sanitizedIngredients.join(', ')}. Return ONLY valid JSON with this structure: {"recipes":[{"title":"Recipe Name","description":"Brief description","cookTime":"X mins","servings":"X servings","ingredients":["item1","item2"],"instructions":["step1","step2"]}]}. No markdown, just JSON.`
        }],
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const recipes = JSON.parse(content);

    return new Response(JSON.stringify(recipes), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ recipes: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
