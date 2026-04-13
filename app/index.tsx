import ImageDetailModal from '@/components/ImageDetailModal';
import PageWrapper from '@/components/PageWrapper';
import ShimmerSkeleton from '@/components/ShimmerSkeleton';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme as useSystemColorScheme,
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
const ITEM_WIDTH = (width - 64) / COLUMN_COUNT;

interface ImageData {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

export default function GalleryScreen() {
  const router = useRouter();
  const systemColorScheme = useSystemColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');
  const [images, setImages] = useState<ImageData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  
  const isDark = theme === 'dark';
  const scrollY = useSharedValue(0);
  const isFetching = useRef(false);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('user-theme');
      if (savedTheme) {
        setTheme(savedTheme as 'light' | 'dark');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('user-theme', newTheme);
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const fetchImages = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    try {
      const response = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=20`);
      const data = await response.json();
      setImages(prev => [...prev, ...data]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [page]); // Removed loading from dependencies to stop the loop

  useEffect(() => {
    fetchImages();
  }, []); // Only fetch once on mount

  const renderItem = ({ item, index }: { item: ImageData; index: number }) => {
    return (
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
            transition={1000}
          />
          <View style={styles.overlay}>
            <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.topBar}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>PixShuffle</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.themeToggle, { backgroundColor: isDark ? '#222' : '#f0f0f0' }]}
            onPress={() => router.push('/favorites')}
          >
            <Ionicons name="heart" size={22} color="#FF2D55" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.themeToggle, { backgroundColor: isDark ? '#222' : '#f0f0f0' }]}
            onPress={toggleTheme}
          >
            <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={isDark ? "#FFD700" : "#555"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <PageWrapper>

    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <Animated.FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id + index}
        numColumns={COLUMN_COUNT}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.gallery}
        onEndReached={fetchImages}
        onEndReachedThreshold={0.5}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListFooterComponent={() => loading ? (
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} style={{ marginVertical: 30 }} />
        ) : null}
        showsVerticalScrollIndicator={false}
      />

      {loading && images.length === 0 && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
          <View style={styles.gallery}>
            {renderHeader()}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={styles.imageContainer}>
                  <ShimmerSkeleton 
                    width={ITEM_WIDTH} 
                    height={ITEM_WIDTH * 1.6} 
                    radius={28} 
                  />
                  <View style={styles.overlay}>
                    <ShimmerSkeleton 
                      width={ITEM_WIDTH * 0.6} 
                      height={12} 
                      radius={4}
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <ImageDetailModal 
        visible={!!selectedImage}
        onClose={() => setSelectedImage(null)}
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
  },
  headerContent: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeToggle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  gallery: {
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.6,
    margin: 8,
    borderRadius: 28,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  author: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  skeletonCard: {
    margin: 8,
  }
});
