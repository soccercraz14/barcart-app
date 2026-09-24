import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import suggestedRecipes from './data/suggestedRecipes.json';

// `alcoholic` drives Mocktail Mode — a recipe is a mocktail only if none of its
// ingredients are alcoholic, so there's no hand-set flag to get out of sync.
const BOTTLES = [
  { id: 'mionetto', name: 'Mionetto Sparkling (0%)', alcoholic: false },
  { id: 'titos', name: "Tito's Vodka", alcoholic: true },
  { id: 'blue_curacao', name: 'Blue Curaçao', alcoholic: true },
  { id: 'st_germain', name: 'St-Germain Elderflower', alcoholic: true },
  { id: 'cointreau', name: 'Cointreau Triple Sec', alcoholic: true },
  { id: 'orange_bitters', name: 'Orange Bitters', alcoholic: true },
  { id: 'lychee_juice', name: '100% Lychee Juice', alcoholic: false },
];

const ALCOHOLIC_IDS = new Set(BOTTLES.filter((b) => b.alcoholic).map((b) => b.id));
const isMocktail = (recipe) => !recipe.ingredients.some((id) => ALCOHOLIC_IDS.has(id));

// Stores the bottles the user has switched OFF, so bottles added later default to on.
const STORAGE_KEY = 'barcart:prefs:v1';

const RECIPES = [
  {
    id: '1',
    name: 'The Elderflower Spritz',
    ingredients: ['st_germain', 'mionetto'],
    spec: ['1.5 oz St-Germain', '3 oz Mionetto Alcohol-Removed Sparkling Wine', '1 oz Club Soda'],
    method: 'Build directly in a wine glass filled with fresh ice. Stir gently to integrate without losing carbonation.',
    glassware: 'Wine glass garnished with a lemon wheel and a slapped mint sprig',
  },
  {
    id: '2',
    name: 'The Cosmopolitan (Premium Spec)',
    ingredients: ['titos', 'cointreau'],
    spec: ["1.5 oz Tito's Handmade Vodka", '0.75 oz Cointreau', '0.75 oz Fresh Lime Juice', '0.5 oz Cranberry Juice Cocktail'],
    method: 'Combine all ingredients into a cocktail shaker with ice. Shake vigorously for 10-12 seconds and double strain.',
    glassware: 'Chilled coupe glass with an expressed orange peel',
  },
  {
    id: '3',
    name: 'The Azure Breeze',
    ingredients: ['titos', 'blue_curacao', 'orange_bitters'],
    spec: ["1.5 oz Tito's Handmade Vodka", '0.75 oz DeKuyper Blue Curaçao', '0.75 oz Fresh Lemon Juice', '0.5 oz Simple Syrup (1:1)', '2 dashes Angostura Orange Bitters'],
    method: 'Shake all ingredients well with ice, then strain into a rocks glass over fresh ice cubes.',
    glassware: 'Rocks glass garnished with a fresh lemon wheel',
  },
  {
    id: '4',
    name: 'Nectar of the Gods',
    ingredients: ['titos', 'st_germain', 'cointreau'],
    spec: ["1.5 oz Tito's Handmade Vodka", '0.75 oz St-Germain Elderflower Liqueur', '0.25 oz Cointreau', '0.5 oz Fresh Lemon Juice'],
    method: 'Add all ingredients to a shaker with ice. Shake hard to chill and aerate, then strain cleanly.',
    glassware: 'Chilled martini or coupe glass',
  },
  {
    id: '5',
    name: 'Blue Lagoon',
    ingredients: ['blue_curacao'],
    spec: ['0.75 oz DeKuyper Blue Curaçao', '4 oz Premium Lemonade', 'Top with Lemon-Lime Soda'],
    method: 'Fill a highball glass with crushed ice. Pour in the ingredients, letting the blue color swirl, and stir gently.',
    glassware: 'Highball glass garnished with a maraschino cherry',
  },
  {
    id: '6',
    name: 'Citrus Starlight',
    ingredients: ['mionetto', 'st_germain', 'orange_bitters'],
    spec: ['3 oz Mionetto Alcohol-Removed Sparkling Wine', '1 oz Fresh Grapefruit Juice', '0.5 oz St-Germain Elderflower Liqueur', '1 dash Angostura Orange Bitters'],
    method: 'Combine grapefruit juice, St-Germain, and bitters in a glass with ice. Top off with the sparkling wine and stir from the bottom.',
    glassware: 'Flute or elegant coupe glass',
  },
  {
    id: '7',
    name: 'The French Sparkler',
    ingredients: ['titos', 'st_germain', 'cointreau', 'mionetto'],
    spec: ["1 oz Tito's Handmade Vodka", '0.5 oz St-Germain', '0.25 oz Cointreau', '0.5 oz Fresh Lemon Juice', 'Top with Mionetto Sparkling'],
    method: 'Shake vodka, elderflower, triple sec, and lemon juice with ice. Strain into a glass and top with sparkling wine.',
    glassware: 'Champagne flute or coupe with a lemon twist',
  },
  {
    id: '8',
    name: 'Blue Diamond Highball',
    ingredients: ['titos', 'blue_curacao', 'cointreau'],
    spec: ["1.25 oz Tito's Handmade Vodka", '0.5 oz Blue Curaçao', '0.5 oz Cointreau', '0.75 oz Fresh Lime Juice', 'Top with Club Soda'],
    method: 'Shake the spirits and lime juice together with ice. Strain into a tall glass over cracked ice and fill up with club soda.',
    glassware: 'Collins glass with a lime wheel setup',
  },
  {
    id: '9',
    name: 'The Lychee French 75',
    ingredients: ['titos', 'lychee_juice', 'st_germain', 'orange_bitters', 'mionetto'],
    spec: ["1.5 oz Tito's Vodka", '1.5 oz Lychee Juice', '0.5 oz St-Germain', '0.5 oz Lemon Juice', '2 dashes Orange Bitters', '2 oz Mionetto 0% Sparkling'],
    method: 'Shake vodka, lychee, St-Germain, lemon, and bitters with ice. Strain into glass and top with sparkling wine.',
    glassware: 'Chilled coupe or flute with lemon twist',
  },
  {
    id: '10',
    name: 'The Lychee & Elderflower Fizz',
    ingredients: ['lychee_juice', 'st_germain', 'mionetto'],
    spec: ['2 oz 100% Lychee Juice', '0.5 oz St-Germain Elderflower Liqueur', '0.5 oz Fresh Lemon Juice', '2 oz Mionetto Alcohol-Removed Sparkling Wine', '1 oz Club Soda'],
    method: 'Shake lychee juice, St-Germain, and lemon juice with ice. Strain into glass and top with sparkling wine and club soda.',
    glassware: 'Coupe or flute garnished with a lemon wheel',
  },
  {
    id: '11',
    name: 'The Lychee Sparkler',
    ingredients: ['lychee_juice', 'mionetto'],
    spec: ['2 oz 100% Lychee Juice', '0.5 oz Fresh Lemon Juice', '3 oz Mionetto Alcohol-Removed Sparkling Wine', 'Top with Club Soda'],
    method: 'Stir lychee juice and lemon juice over ice in the glass. Top with sparkling wine and a splash of soda, then stir gently from the bottom.',
    glassware: 'Wine glass or flute garnished with a lychee and lemon twist',
  },
];

function MocktailBadge({ recipe }) {
  const mocktail = isMocktail(recipe);
  return (
    <View style={[styles.badge, mocktail ? styles.badgeMocktail : styles.badgeCocktail]}>
      <Text style={styles.badgeText}>{mocktail ? '0% ABV' : 'Cocktail'}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <BarCart />
    </SafeAreaProvider>
  );
}

function BarCart() {
  const [disabledBottles, setDisabledBottles] = useState([]);
  const [mocktailOnly, setMocktailOnly] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.disabledBottles)) setDisabledBottles(saved.disabledBottles);
        if (typeof saved.mocktailOnly === 'boolean') setMocktailOnly(saved.mocktailOnly);
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true));
  }, []);

  useEffect(() => {
    // Don't overwrite saved prefs with the defaults before they've loaded.
    if (!prefsLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ disabledBottles, mocktailOnly })).catch(() => {});
  }, [disabledBottles, mocktailOnly, prefsLoaded]);

  const cabinet = useMemo(
    () => BOTTLES.map((b) => b.id).filter((id) => !disabledBottles.includes(id)),
    [disabledBottles]
  );

  const toggleBottle = (id) => {
    setDisabledBottles((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const canMake = (recipe) => {
    if (mocktailOnly && !isMocktail(recipe)) return false;
    return recipe.ingredients.every((neededId) => cabinet.includes(neededId));
  };

  const availableRecipes = useMemo(() => RECIPES.filter(canMake), [cabinet, mocktailOnly]);
  const visibleSuggestedRecipes = useMemo(() => suggestedRecipes.filter(canMake), [cabinet, mocktailOnly]);

  const listHeader = (
    <>
      <View style={styles.cabinetSection}>
        <Text style={styles.sectionTitle}>My Cabinet Setup</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {BOTTLES.map((bottle) => {
            const isActive = cabinet.includes(bottle.id);
            return (
              <TouchableOpacity
                key={bottle.id}
                style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
                onPress={() => toggleBottle(bottle.id)}
              >
                <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                  {bottle.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
              <View key={item.id} style={styles.suggestedCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.suggestedName}>{item.name}</Text>
                  <MocktailBadge recipe={item} />
                </View>
                {item.spec.map((line, index) => (
                  <Text key={index} style={styles.bodyTextSmall}>• {line}</Text>
                ))}
                <Text style={styles.suggestedSource}>via {item.source}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.matchesTitle]}>
        Matches Found ({availableRecipes.length})
      </Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agora BarCart</Text>
        <Text style={styles.headerSubtitle}>Dynamic Home Menu & Recipe Index</Text>
      </View>

      {/* One scrolling list so the recipes aren't squeezed below a fixed header on small screens. */}
      <FlatList
        data={availableRecipes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No match available. Try selecting more ingredients from your cabinet list above.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.recipeCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.recipeName}>{item.name}</Text>
              <MocktailBadge recipe={item} />
            </View>

            <Text style={styles.fieldLabel}>Ingredients</Text>
            {item.spec.map((line, index) => (
              <Text key={index} style={styles.bodyText}>• {line}</Text>
            ))}

            <Text style={styles.fieldLabel}>Method</Text>
            <Text style={styles.bodyText}>{item.method}</Text>

            <Text style={styles.fieldLabel}>Glassware & Presentation</Text>
            <Text style={styles.bodyText}>{item.glassware}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#1a1a1e', borderBottomWidth: 1, borderBottomColor: '#26262b' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 12, color: '#a1a1aa', marginTop: 2 },
  cabinetSection: { marginTop: 16 },
  horizontalScrollContent: { paddingHorizontal: 24, paddingBottom: 4, flexDirection: 'row', gap: 10 },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#1a1a1e', marginHorizontal: 24, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#26262b' },
  toggleTextGroup: { flex: 1, paddingRight: 10 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  toggleSubLabel: { fontSize: 11, color: '#a1a1aa', marginTop: 1 },
  listContent: { paddingBottom: 40 },
  matchesTitle: { marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#71717a', marginBottom: 10, paddingHorizontal: 24, textTransform: 'uppercase', letterSpacing: 1.2 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  pillActive: { backgroundColor: '#e4e4e7', borderColor: '#e4e4e7' },
  pillInactive: { backgroundColor: 'transparent', borderColor: '#27272a' },
  pillText: { fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: '#09090b' },
  pillTextInactive: { color: '#a1a1aa' },
  recipeCard: { backgroundColor: '#1a1a1e', borderRadius: 16, padding: 18, marginBottom: 14, marginHorizontal: 24, borderWidth: 1, borderColor: '#26262b' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  recipeName: { fontSize: 18, fontWeight: '700', color: '#ffffff', flex: 1, paddingRight: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeMocktail: { backgroundColor: '#16a34a' },
  badgeCocktail: { backgroundColor: '#4f46e5' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#a1a1aa', marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  bodyText: { fontSize: 14, color: '#e4e4e7', marginTop: 3, lineHeight: 22 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  emptyStateText: { color: '#71717a', textAlign: 'center', fontSize: 14, lineHeight: 22 },
  suggestedSection: { marginTop: 20 },
  suggestedCard: { backgroundColor: '#1a1a1e', borderRadius: 16, padding: 16, width: 240, borderWidth: 1, borderColor: '#3a2f14', borderStyle: 'dashed' },
  suggestedName: { fontSize: 15, fontWeight: '700', color: '#ffffff', flex: 1, paddingRight: 8 },
  bodyTextSmall: { fontSize: 12, color: '#d4d4d8', marginTop: 3, lineHeight: 18 },
  suggestedSource: { fontSize: 10, color: '#71717a', marginTop: 10, fontStyle: 'italic' },
});