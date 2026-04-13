import ImageDetailModal from '@/components/ImageDetailModal';
import PageWrapper from '@/components/PageWrapper';
import ShimmerSkeleton from '@/components/ShimmerSkeleton';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  Layout,
  useAnimatedScrollHandler,
  useSharedValue
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48) / COLUMN_COUNT;

interface ImageData {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');
  const [favorites, setFavorites] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  
  const isDark = theme === 'dark';
  const scrollY = useSharedValue(0);

  const loadTheme = useCallback(async () => {
    const savedTheme = await AsyncStorage.getItem('user-theme');
    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark');
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem('user-favorites');
      if (favoritesJson) {
        setFavorites(JSON.parse(favoritesJson));
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTheme();
      loadFavorites();
    }, [loadTheme, loadFavorites])
  );

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const renderItem = ({ item, index }: { item: ImageData; index: number }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => setSelectedImage(item)}
    >
      <Animated.View 
        entering={FadeInDown.delay((index % 20) * 50).duration(600)}
        layout={Layout.springify()}
        style={[styles.imageContainer, { backgroundColor: isDark ? '#1a1a1a' : '#eaeaea' }]}
      >
        <Image
          source={{ uri: `https://picsum.photos/id/${item.id}/${Math.floor(ITEM_WIDTH * 2)}/${Math.floor(ITEM_WIDTH * 2.5)}` }}
          style={styles.image}
          contentFit="cover"
          transition={500}
        />
        <View style={styles.overlay}>
          <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
          <Ionicons name="heart" size={14} color="#FF2D55" style={{ marginLeft: 6 }} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: isDark ? '#222' : '#fff' }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Favorites</Text>
      <View style={{ width: 44 }} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.gallery}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {[...Array(4)].map((_, i) => (
              <View key={i} style={styles.imageContainer}>
                <ShimmerSkeleton width={ITEM_WIDTH} height={ITEM_WIDTH * 1.6} radius={28} />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <PageWrapper>



    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      {renderHeader()}
      
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={80} color={isDark ? '#333' : '#ccc'} />
          <Text style={[styles.emptyText, { color: isDark ? '#666' : '#999' }]}>No favorites yet</Text>
          <TouchableOpacity 
            style={[styles.exploreButton, { backgroundColor: isDark ? '#fff' : '#000' }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.exploreText, { color: isDark ? '#000' : '#fff' }]}>Explore Images</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.gallery}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ImageDetailModal 
        visible={!!selectedImage}
        onClose={() => {
          setSelectedImage(null);
          loadFavorites();
        }}
        image={selectedImage}
        isDark={isDark}
      />
    </View>
    </PageWrapper>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1,
  },
  gallery: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.6,
    margin: 8,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  image: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  author: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
    marginTop: 16,
  },
  exploreButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  exploreText: {
    color: '#fff',
    fontWeight: '700',
  },
});
