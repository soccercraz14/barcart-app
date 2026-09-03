import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function BottlePicker({ bottles, cabinet, onToggle }) {
  return (
    <View style={styles.cabinetSection}>
      <Text style={styles.sectionTitle}>My Cabinet Setup</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {bottles.map((bottle) => {
          const isActive = cabinet.includes(bottle.id);
          return (
            <TouchableOpacity
              key={bottle.id}
              style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
              onPress={() => onToggle(bottle.id)}
            >
              <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                {bottle.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cabinetSection: { marginTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#71717a', marginBottom: 10, paddingHorizontal: 24, textTransform: 'uppercase', letterSpacing: 1.2 },
  horizontalScrollContent: { paddingHorizontal: 24, paddingBottom: 4, flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  pillActive: { backgroundColor: '#e4e4e7', borderColor: '#e4e4e7' },
  pillInactive: { backgroundColor: 'transparent', borderColor: '#27272a' },
  pillText: { fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: '#09090b' },
  pillTextInactive: { color: '#a1a1aa' },
});
