import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import suggestedRecipes from './data/suggestedRecipes.json';
import { BOTTLES, RECIPES } from './data';
import { usePersistedPrefs } from './usePersistedPrefs';
import BottlePicker from './components/BottlePicker';
import RecipeCard from './components/RecipeCard';
import RecipeDetailModal from './components/RecipeDetailModal';

export default function App() {
  const { cabinet, setCabinet, mocktailOnly, setMocktailOnly } = usePersistedPrefs(
    BOTTLES.map((b) => b.id)
  );
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const toggleBottle = (id) => {
    if (cabinet.includes(id)) {
      setCabinet(cabinet.filter((item) => item !== id));
    } else {
      setCabinet([...cabinet, id]);
    }
  };

  const availableRecipes = useMemo(() => {
    return RECIPES.filter((recipe) => {
      if (mocktailOnly && !recipe.isMocktail) return false;
      return recipe.ingredients.every((neededId) => cabinet.includes(neededId));
    });
  }, [cabinet, mocktailOnly]);

  const visibleSuggestedRecipes = useMemo(() => {
    return suggestedRecipes.filter((recipe) => !mocktailOnly || recipe.isMocktail);
  }, [mocktailOnly]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agora BarCart</Text>
        <Text style={styles.headerSubtitle}>Dynamic Home Menu & Recipe Index</Text>
      </View>

      <BottlePicker bottles={BOTTLES} cabinet={cabinet} onToggle={toggleBottle} />

      <View style={styles.toggleContainer}>
        <View style={styles.toggleTextGroup}>
          <Text style={styles.toggleLabel}>Mocktail Mode</Text>
          <Text style={styles.toggleSubLabel}>Hide recipes containing alcohol</Text>
        </View>
        <Switch
          trackColor={{ false: '#3a3a3c', true: '#34c759' }}
          thumbColor="#ffffff"
          onValueChange={setMocktailOnly}
          value={mocktailOnly}
        />
      </View>

      {visibleSuggestedRecipes.length > 0 && (
        <View style={styles.suggestedSection}>
          <Text style={styles.sectionTitle}>New This Week 🍸</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {visibleSuggestedRecipes.map((item) => (
              <View key={item.id} style={styles.suggestedCardWrap}>
                <RecipeCard
                  recipe={item}
                  onPress={() => setSelectedRecipe(item)}
                  sourceLabel={`via ${item.source}`}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.feedSection}>
        <Text style={styles.sectionTitleLeft}>
          Matches Found ({availableRecipes.length})
        </Text>

        {availableRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No match available. Try selecting more ingredients from your cabinet list above.
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableRecipes}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <RecipeCard recipe={item} onPress={() => setSelectedRecipe(item)} />
            )}
            contentContainerStyle={{ paddingBottom: 160 }}
          />
        )}
      </View>

      <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#1a1a1e', borderBottomWidth: 1, borderBottomColor: '#26262b' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 12, color: '#a1a1aa', marginTop: 2 },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#1a1a1e', marginHorizontal: 24, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#26262b' },
  toggleTextGroup: { flex: 1, paddingRight: 10 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  toggleSubLabel: { fontSize: 11, color: '#a1a1aa', marginTop: 1 },
  feedSection: { flex: 1, paddingHorizontal: 24, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#71717a', marginBottom: 10, paddingHorizontal: 24, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionTitleLeft: { fontSize: 11, fontWeight: '800', color: '#71717a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.2 },
  horizontalScrollContent: { paddingHorizontal: 24, paddingBottom: 4, flexDirection: 'row', gap: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  emptyStateText: { color: '#71717a', textAlign: 'center', fontSize: 14, lineHeight: 22 },
  suggestedSection: { marginTop: 20 },
  suggestedCardWrap: { width: 240, marginRight: 12 },
});
