import { showToast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageData {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

interface ImageDetailModalProps {
  visible: boolean;
  onClose: () => void;
  image: ImageData | null;
  isDark: boolean;
}

export default function ImageDetailModal({
  visible,
  onClose,
  image,
  isDark,
}: ImageDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'share' | 'download' | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (visible && image) {
      checkIfFavorite();
    }
  }, [visible, image]);

  if (!image) return null;

  const checkIfFavorite = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem('user-favorites');
      if (favoritesJson) {
        const favorites: ImageData[] = JSON.parse(favoritesJson);
        setIsFavorite(favorites.some((fav) => fav.id === image.id));
      }
    } catch (e) {
      console.error('Error checking favorites:', e);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem('user-favorites');
      let favorites: ImageData[] = favoritesJson ? JSON.parse(favoritesJson) : [];
      
      if (isFavorite) {
        favorites = favorites.filter((fav) => fav.id !== image.id);
      } else {
        favorites.push(image);
      }
      
      await AsyncStorage.setItem('user-favorites', JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
      showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (e) {
      console.error('Error toggling favorite:', e);
      showToast('Could not update favorites');
    }
  };

  const handleShare = async () => {
    if (loading) return;
    setLoading(true);
    setActionType('share');
    try {
      const { download_url, id } = image;
      const fileUri = `${FileSystem.cacheDirectory}${id}.jpg`;
      
      const downloadResumable = FileSystem.createDownloadResumable(
        download_url,
        fileUri,
        {}
      );

      const downloadResult = await downloadResumable.downloadAsync();
      
      if (downloadResult && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(downloadResult.uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not share image');
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    setActionType('download');
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save images to your gallery.');
        return;
      }

      const { download_url, id } = image;
      const fileUri = `${FileSystem.documentDirectory}${id}.jpg`;
      
      const downloadResumable = FileSystem.createDownloadResumable(
        download_url,
        fileUri,
        {}
      );

      const downloadResult = await downloadResumable.downloadAsync();
      
      if (downloadResult) {
        // Use createAssetAsync which handles the localized file better
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        // On Android, we don't always need to create an album, but if we do, we ensure asset is passed correctly
        await MediaLibrary.createAlbumAsync('PixShuffle', asset, false);
        showToast('Image saved to gallery!');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not save image');
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable
          style={[
            styles.backdrop,
            {
              backgroundColor: isDark
                ? 'rgba(0,0,0,0.7)'
                : 'rgba(0,0,0,0.5)',
            },
          ]}
          onPress={onClose}
        />

        <View 
          style={[
            styles.sheet, 
            { backgroundColor: isDark ? '#121212' : '#fff' }
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
          </View>

          <SafeAreaView style={styles.content} edges={['bottom']}>
            {/* Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.authorBadge,
                  { backgroundColor: isDark ? '#222' : '#f2f2f2' },
                ]}
              >
                <Text
                  style={[
                    styles.authorName,
                    { color: isDark ? '#fff' : '#000' },
                  ]}
                >
                  {image.author}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeButton,
                  { backgroundColor: isDark ? '#222' : '#f2f2f2' },
                ]}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            </View>

            {/* Image */}
            <View style={styles.imageWrapper}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: image.download_url }}
                  style={styles.image}
                  contentFit="contain"
                  transition={0}
                />
              </View>
            </View>

            {/* Details Section */}
            <View style={styles.detailsContainer}>
              <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#eee' }]}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: isDark ? '#666' : '#999' }]}>RESOLUTION</Text>
                    <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#000' }]}>{image.width} × {image.height}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: isDark ? '#666' : '#999' }]}>ID</Text>
                    <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#000' }]}>#{image.id}</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.urlContainer}
                  onPress={() => Linking.openURL(image.url)}
                >
                  <Text style={[styles.detailLabel, { color: isDark ? '#666' : '#999' }]}>SOURCE URL</Text>
                  <View style={styles.urlRow}>
                    <Text style={[styles.urlText, { color: '#007AFF' }]} numberOfLines={1}>{image.url}</Text>
                    <Ionicons name="open-outline" size={14} color="#007AFF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <View style={[styles.actionBar, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa', borderColor: isDark ? '#333' : '#eee' }]}>
                  <ActionContent 
                    isDark={isDark} 
                    loading={loading} 
                    actionType={actionType}
                    isFavorite={isFavorite}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    toggleFavorite={toggleFavorite}
                  />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const ActionContent = ({ 
  isDark, loading, actionType, isFavorite, handleShare, handleDownload, toggleFavorite 
}: any) => (
  <>
    <TouchableOpacity 
      style={styles.actionButton} 
      onPress={handleShare}
      disabled={loading}
    >
      {loading && actionType === 'share' ? (
        <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
      ) : (
        <Ionicons
          name="share-outline"
          size={24}
          color={isDark ? '#fff' : '#000'}
        />
      )}
      <Text style={[styles.actionText, { color: isDark ? '#aaa' : '#666' }]}>Share</Text>
    </TouchableOpacity>

    <View style={styles.divider} />

    <TouchableOpacity 
      style={styles.actionButton} 
      onPress={handleDownload}
      disabled={loading}
    >
      {loading && actionType === 'download' ? (
        <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
      ) : (
        <Ionicons
          name="cloud-download-outline"
          size={24}
          color={isDark ? '#fff' : '#000'}
        />
      )}
      <Text style={[styles.actionText, { color: isDark ? '#aaa' : '#666' }]}>Save</Text>
    </TouchableOpacity>

    <View style={styles.divider} />

    <TouchableOpacity 
      style={styles.actionButton}
      onPress={toggleFavorite}
    >
      <Ionicons
        name={isFavorite ? "heart" : "heart-outline"}
        size={24}
        color={isFavorite ? "#FF2D55" : (isDark ? '#fff' : '#000')}
      />
      <Text style={[styles.actionText, { color: isDark ? '#aaa' : '#666' }]}>
        {isFavorite ? 'Saved' : 'Fav'}
      </Text>
    </TouchableOpacity>
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  imageWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.35,
    borderRadius: 24,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  detailsCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
    opacity: 0.6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  urlContainer: {
    marginTop: 2,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urlText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 12,
    borderWidth: 1,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
});