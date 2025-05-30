// components/FileUploader.js
import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Alert,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import *as  ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const FileUploader = ({
  uri, // <-- Пропс uri
  setUri,
  type = 'image',
  label,
  containerStyle,
  uploadButtonStyle,
  uploadButtonTextStyle,
  previewImageStyle,
  fileNameStyle,
}) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get('window');

  const pickFile = async () => {
    try {
      if (type === 'image') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('permission_required'),
            t('permission_media_library_photos')
          );
          return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setUri(result.assets[0].uri);
        }
      } else { // type === 'document'
        let result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setUri(result.assets[0].uri);
        } else if (result.canceled) {
          console.log('Document selection cancelled');
        } else {
          Alert.alert(t('error_title'), t('error_document_select_failed'));
        }
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert(t('error_title'), t('error_file_picking') + ": " + error.message);
    }
  };

  const getFileName = (fileUri) => {
    return fileUri ? fileUri.split('/').pop() : '';
  };

  return (
    <View style={styles.outerContainer}>
      {label && <Text style={styles.labelStyle}>{label}</Text>}

      <View style={[styles.mainContentContainer, containerStyle]}>
        <TouchableOpacity
          style={[
            // Тепер передаємо uri як другий аргумент до стильової функції
            styles.uploadButton(width, uri), // <-- ЗМІНЕНО ТУТ
            uploadButtonStyle,
          ]}
          onPress={pickFile}
        >
          <Ionicons
            name={type === 'image' ? 'image-outline' : 'document-outline'}
            size={24}
            color="#fff"
          />
          <Text style={[styles.uploadButtonText, uploadButtonTextStyle]}>
            {t('upload_file')}
          </Text>
        </TouchableOpacity>

        {uri && (
          <View style={styles.previewContainer}>
            {type === 'image' ? (
              <Image source={{ uri }} style={[styles.previewImage, previewImageStyle]} />
            ) : (
              <Text style={[styles.fileName, fileNameStyle]} numberOfLines={1} ellipsizeMode="middle">
                {getFileName(uri)}
              </Text>
            )}
            <TouchableOpacity onPress={() => setUri(null)} style={styles.clearButton}>
              <Ionicons name="close-circle" size={24} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelStyle: {
    fontSize: 14,
    alignSelf: "flex-start",
    color: "#2A2A2A",
    // fontFamily: "Mont-Medium",
    paddingHorizontal: Dimensions.get('window').width * 0.05 + 20,
    marginTop: 10,
    marginBottom: 5,
  },
  mainContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: Dimensions.get('window').width * 0.9,
  },
  // ЗМІНЕНО ТУТ: тепер функція приймає uri як другий аргумент
  uploadButton: (width, uri) => ({
    backgroundColor: "#0EB3EB",
    borderRadius: 555,
    paddingVertical: 15,
    // Використовуємо uri, який передається в цю функцію
    width: width * (uri ? 0.9 * 0.7 : 0.9),
    height: 52,
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  }),
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    // fontFamily: "Mont-Medium",
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    width: 'auto',
    maxWidth: Dimensions.get('window').width * 0.9 * 0.3,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 8,
    resizeMode: 'cover',
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    marginRight: 5,
  },
  clearButton: {
    padding: 2,
  },
});

export default FileUploader;