import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

export default function RecipeDetailModal({ recipe, onClose }) {
  return (
    <Modal visible={!!recipe} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          {recipe && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={styles.name}>{recipe.name}</Text>
                <View style={[styles.badge, recipe.isMocktail ? styles.badgeMocktail : styles.badgeCocktail]}>
                  <Text style={styles.badgeText}>{recipe.isMocktail ? '0% ABV' : 'Cocktail'}</Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Ingredients</Text>
              {recipe.spec.map((line, index) => (
                <Text key={index} style={styles.bodyText}>• {line}</Text>
              ))}

              <Text style={styles.fieldLabel}>Method</Text>
              <Text style={styles.bodyText}>{recipe.method}</Text>

              <Text style={styles.fieldLabel}>Glassware & Presentation</Text>
              <Text style={styles.bodyText}>{recipe.glassware}</Text>

              {recipe.source && (
                <Text style={styles.source}>via {recipe.source}</Text>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a1a1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: '#ffffff', flex: 1, paddingRight: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeMocktail: { backgroundColor: '#16a34a' },
  badgeCocktail: { backgroundColor: '#4f46e5' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#a1a1aa', marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.8 },
  bodyText: { fontSize: 14, color: '#e4e4e7', marginTop: 3, lineHeight: 22 },
  source: { fontSize: 11, color: '#71717a', marginTop: 14, fontStyle: 'italic' },
  closeButton: { marginTop: 24, marginBottom: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#27272a', alignItems: 'center' },
  closeButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
