import { createContext, useContext, useState, ReactNode } from 'react';
import { Recipe, RecipeSelection } from '../types';

interface MealDraft {
  selections: RecipeSelection[];
  addRecipe: (recipe: Recipe, servings: number) => void;
  changeServings: (id: number, servings: number) => void;
  removeRecipe: (id: number) => void;
  clearRecipes: () => void;
}
const Context = createContext<MealDraft | null>(null);

export function MealDraftProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<RecipeSelection[]>([]);
  function addRecipe(recipe: Recipe, servings: number) {
    if (!Number.isFinite(servings) || servings <= 0) throw new Error('Invalid servings');
    setSelections(current => {
      const existing = current.find(s => s.recipe.id === recipe.id);
      return existing
        ? current.map(s => s.recipe.id === recipe.id ? { ...s, servings: s.servings + servings } : s)
        : [...current, { recipe: { ...recipe }, servings }];
    });
  }
  return <Context.Provider value={{ selections, addRecipe,
    changeServings: (id, servings) => {
      if (!Number.isFinite(servings) || servings <= 0) throw new Error('Invalid servings');
      setSelections(current => current.map(s => s.recipe.id === id ? { ...s, servings } : s));
    },
    removeRecipe: id => setSelections(current => current.filter(s => s.recipe.id !== id)),
    clearRecipes: () => setSelections([]),
  }}>{children}</Context.Provider>;
}

export function useMealDraft() {
  const context = useContext(Context);
  if (!context) throw new Error('MealDraftProvider is missing');
  return context;
}
