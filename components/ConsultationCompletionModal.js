import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function ConsultationCompletionModal({
  isVisible,
  onClose,
  onSubmit,
  isLoading
}) {
  const { t } = useTranslation();
  const [consultationConducted, setConsultationConducted] = useState(false);
  const [consultationStartedOnTime, setConsultationStartedOnTime] = useState(false);
  const [doctorFeedback, setDoctorFeedback] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isVisible) {
      // Reset state when modal closes
      setConsultationConducted(false);
      setConsultationStartedOnTime(false);
      setDoctorFeedback('');
      setErrors({});
    }
  }, [isVisible]);

  const handleSubmitInternal = () => {
    const newErrors = {};
    if (!consultationConducted) {
      newErrors.consultationConducted = t('consultation_conducted_required');
    }
    if (!consultationStartedOnTime) {
      newErrors.consultationStartedOnTime = t('consultation_started_on_time_required');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      consultationConducted,
      consultationStartedOnTime,
      doctorFeedback: doctorFeedback.trim(),
    });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-circle-outline" size={moderateScale(30)} color="#888" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{t('complete_consultation_title')}</Text>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setConsultationConducted(!consultationConducted)}
              >
                <Ionicons
                  name={consultationConducted ? 'checkbox-outline' : 'square-outline'}
                  size={moderateScale(24)}
                  color={consultationConducted ? '#4CAF50' : '#777'}
                />
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>{t('consultation_conducted_question')}</Text>
            </View>
            {errors.consultationConducted && (
              <Text style={styles.errorText}>{errors.consultationConducted}</Text>
            )}

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setConsultationStartedOnTime(!consultationStartedOnTime)}
              >
                <Ionicons
                  name={consultationStartedOnTime ? 'checkbox-outline' : 'square-outline'}
                  size={moderateScale(24)}
                  color={consultationStartedOnTime ? '#4CAF50' : '#777'}
                />
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>{t('consultation_started_on_time_question')}</Text>
            </View>
            {errors.consultationStartedOnTime && (
              <Text style={styles.errorText}>{errors.consultationStartedOnTime}</Text>
            )}

            <Text style={styles.inputLabel}>{t('doctor_feedback_label')}</Text>
            <TextInput
              style={styles.feedbackInput}
              multiline
              numberOfLines={4}
              placeholder={t('doctor_feedback_placeholder')}
              placeholderTextColor="#aaa"
              value={doctorFeedback}
              onChangeText={setDoctorFeedback}
            />

            <TouchableOpacity
              onPress={handleSubmitInternal}
              style={styles.submitButton}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#0EB3EB', '#0A8BC2']}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('submit_completion')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: moderateScale(20),
    padding: moderateScale(25),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    zIndex: 1,
  },
  modalTitle: {
    fontFamily: 'Mont-Bold',
    fontSize: moderateScale(20),
    marginBottom: verticalScale(20),
    color: '#333',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(15),
    width: '100%',
  },
  checkbox: {
    padding: moderateScale(5),
  },
  checkboxLabel: {
    fontFamily: 'Mont-Medium',
    fontSize: moderateScale(16),
    marginLeft: moderateScale(10),
    color: '#555',
    flexShrink: 1,
  },
  inputLabel: {
    fontFamily: 'Mont-Medium',
    fontSize: moderateScale(16),
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: verticalScale(8),
    marginTop: verticalScale(10),
  },
  feedbackInput: {
    width: '100%',
    minHeight: verticalScale(100),
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(10),
    fontFamily: 'Mont-Regular',
    fontSize: moderateScale(15),
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: verticalScale(20),
  },
  submitButton: {
    width: '100%',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: verticalScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(12),
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: 'Mont-SemiBold',
    fontSize: moderateScale(17),
  },
  errorText: {
    fontFamily: 'Mont-Regular',
    fontSize: moderateScale(13),
    color: 'red',
    alignSelf: 'flex-start',
    marginTop: -verticalScale(10),
    marginBottom: verticalScale(10),
    marginLeft: moderateScale(40), // Align with checkbox label
  },
});