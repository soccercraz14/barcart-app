import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RecipeCard({ recipe, onPress, sourceLabel }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <View style={[styles.badge, recipe.isMocktail ? styles.badgeMocktail : styles.badgeCocktail]}>
          <Text style={styles.badgeText}>{recipe.isMocktail ? '0% ABV' : 'Cocktail'}</Text>
        </View>
      </View>
      <Text style={styles.glassware}>{recipe.glassware}</Text>
      {sourceLabel && <Text style={styles.source}>{sourceLabel}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1a1a1e', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#26262b' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  recipeName: { fontSize: 18, fontWeight: '700', color: '#ffffff', flex: 1, paddingRight: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeMocktail: { backgroundColor: '#16a34a' },
  badgeCocktail: { backgroundColor: '#4f46e5' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
  glassware: { fontSize: 13, color: '#a1a1aa', marginTop: 8, lineHeight: 18 },
  source: { fontSize: 10, color: '#71717a', marginTop: 8, fontStyle: 'italic' },
});
