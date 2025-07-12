
import React, { useEffect, useState, } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Switch,
  TextInput,
  ScrollView,
  
} from 'react-native';
import { useTranslation } from 'react-i18next';

// Одиниці масштабування для адаптивного інтерфейсу
const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const FeedbackModal = ({ isVisible, onClose, onSubmit, initialBookingId }) => {
  const { t } = useTranslation();
  const [consultationOccurred, setConsultationOccurred] = useState(false);
  const [consultationOnTime, setConsultationOnTime] = useState(false);
  const [starRating, setStarRating] = useState(0); // Змінено: тепер це число, а не input
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);

  // Функція для візуалізації зірок (скопійовано з WriteReview.js, адаптовано)
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setStarRating(i)} disabled={loading}>
          <Text style={i <= starRating ? modalStyles.starFilled : modalStyles.starEmpty}>
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={modalStyles.starsContainer}>{stars}</View>;
  };

  // Скидання стану при відкритті модального вікна
  useEffect(() => {
    if (isVisible) {
      setConsultationOccurred(false);
      setConsultationOnTime(false);
      setStarRating(0); // Скидаємо рейтинг
      setFeedbackText('');
      setLoading(false);
    }
  }, [isVisible]);

  const handleSubmit = async () => {
    if (loading) return;

    // Перевірка обов'язкових полів: тепер starRating має бути більше 0
    if (!consultationOccurred || !consultationOnTime || starRating === 0) {
      Alert.alert(t('error'), t('feedback_modal.fill_all_required_fields'));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(
        initialBookingId,
        consultationOccurred,
        consultationOnTime,
        starRating, // Використовуємо значення starRating безпосередньо
        feedbackText
      );
      onClose();
    } catch (error) {
      console.error("Error submitting feedback from modal:", error);
      Alert.alert(t('error'), `${t('feedback_modal.failed_to_submit_feedback')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.centeredView}>
          <TouchableWithoutFeedback><ScrollView style={{marginTop: 60,}}>
            <View style={modalStyles.modalView}>
              <Text style={modalStyles.modalTitle}>{t('feedback_modal.leave_feedback')}</Text>

              <View style={modalStyles.questionContainer}>
                <Text style={modalStyles.questionText}>{t('feedback_modal.consultation_occurred')}</Text>
                <View style={modalStyles.switchContainer}>
                  <Text style={!consultationOccurred ? modalStyles.switchLabelActive : modalStyles.switchLabelInactive}>{t('no')}</Text>
                  <Switch
                    trackColor={{ false: "#767577", true: "#0EB3EB" }}
                    thumbColor={consultationOccurred ? "#f4f3f4" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={setConsultationOccurred}
                    value={consultationOccurred}
                  />
                  <Text style={consultationOccurred ? modalStyles.switchLabelActive : modalStyles.switchLabelInactive}>{t('yes')}</Text>
                </View>
              </View>

              <View style={modalStyles.questionContainer}>
                <Text style={modalStyles.questionText}>{t('feedback_modal.consultation_on_time')}</Text>
                <View style={modalStyles.switchContainer}>
                  <Text style={!consultationOnTime ? modalStyles.switchLabelActive : modalStyles.switchLabelInactive}>{t('no')}</Text>
                  <Switch
                    trackColor={{ false: "#767577", true: "#0EB3EB" }}
                    thumbColor={consultationOnTime ? "#f4f3f4" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={setConsultationOnTime}
                    value={consultationOnTime}
                  />
                  <Text style={consultationOnTime ? modalStyles.switchLabelActive : modalStyles.switchLabelInactive}>{t('yes')}</Text>
                </View>
              </View>

              <View style={modalStyles.questionContainer}>
                <Text style={modalStyles.questionText}>{t('feedback_modal.rate_quality')} (1-5):</Text>
                {renderStars()} 
              </View>

              <View style={modalStyles.questionContainer}>
                <Text style={modalStyles.questionText}>{t('feedback_modal.your_feedback')}</Text>
                <TextInput
                  style={modalStyles.textInput}
                  multiline={true}
                  placeholder={t('feedback_modal.optional_feedback_placeholder')}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  maxLength={500}
                />
                <Text style={modalStyles.charCount}>{feedbackText.length}/500</Text>
              </View>

              <View style={modalStyles.buttonContainer}>
                <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
                  <Text style={modalStyles.buttonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.submitButton} onPress={handleSubmit} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={modalStyles.buttonText}>{t('submit')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View></ScrollView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Стилі для модального вікна
const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    width: width * 0.9,
    backgroundColor: "white",
    borderRadius: moderateScale(20),
    padding: moderateScale(25),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(4),
    elevation: 5,
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontFamily: "Mont-SemiBold",
    marginBottom: verticalScale(20),
    color: "#333",
    textAlign: 'center',
  },
  questionContainer: {
    width: '100%',
    marginBottom: verticalScale(15),
  },
  questionText: {
    fontSize: moderateScale(16),
    fontFamily: "Mont-Medium",
    marginBottom: verticalScale(8),
    color: "#555",
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(15),
  },
  switchLabelActive: {
    fontSize: moderateScale(16),
    fontFamily: "Mont-SemiBold",
    color: '#0EB3EB',
  },
  switchLabelInactive: {
    fontSize: moderateScale(16),
    color: '#888',
  },
  textInput: {
    width: '100%',
    minHeight: verticalScale(50),
    maxHeight: verticalScale(150),
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    fontSize: moderateScale(15),
    fontFamily: "Mont-Regular",
    textAlignVertical: 'top',
    marginTop: verticalScale(5),
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: moderateScale(12),
    color: '#888',
    marginTop: verticalScale(5),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: verticalScale(20),
  },
  submitButton: {
    backgroundColor: '#0EB3EB',
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(30),
    borderRadius: moderateScale(25),
    minWidth: moderateScale(120),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(30),
    borderRadius: moderateScale(25),
    minWidth: moderateScale(120),
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontFamily: "Mont-SemiBold",
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(5),
    alignSelf: 'flex-start',
  },
  starFilled: {
    color: "#FFD700",
    fontSize: moderateScale(30),
    marginRight: moderateScale(5),
  },
  starEmpty: {
    color: "#D3D3D3",
    fontSize: moderateScale(30),
    marginRight: moderateScale(5),
  },
});
export default FeedbackModal;