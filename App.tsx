import { collection, getDocs, limit, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { auth, db } from './src/core/firebase';

export default function App() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'listings'), limit(1)));
        setText(
          `Firebase connected\nProject: ${db.app.options.projectId}\n` +
            `User: ${auth.currentUser?.uid ?? 'not signed in'}\n` +
            `Listings readable: ${snap.size} found`,
        );
      } catch (e) {
        setText(`Error: ${String(e)}`);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {text === null ? <ActivityIndicator /> : <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { textAlign: 'center' },
});