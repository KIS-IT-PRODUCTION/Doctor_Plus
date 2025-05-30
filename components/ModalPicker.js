// components/ModalPicker.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const ModalPicker = ({
  isVisible,
  onClose,
  options,
  onSelect,
  selectedValues = [], // Завжди ініціалізуємо як масив для мультиселекту
  title,
  renderItem,
  isMultiSelect = false,
}) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get('window');

  // Логіка для визначення, чи є елемент вибраним
  const isOptionSelected = (item) => {
    if (isMultiSelect) {
      // Для мультиселекту, selectedValues завжди масив.
      // Ми перевіряємо, чи item вже є в масиві selectedValues.
      // Обробляємо різні можливі структури 'item'
      return selectedValues.some(selected => {
        if (selected && typeof selected === 'object') {
          // Якщо selected - об'єкт, порівнюємо за value або code
          return (item.value && selected.value === item.value) ||
                 (item.code && selected.code === item.code);
        }
        // Якщо selected - простий тип (рядок/число), порівнюємо безпосередньо
        return selected === item;
      });
    } else {
      // Для одиночного вибору, selectedValues може бути об'єктом або простим значенням
      if (selectedValues && typeof selectedValues === 'object') {
        // Якщо selectedValues - об'єкт, порівнюємо за value або code
        return (item.value && selectedValues.value === item.value) ||
               (item.code && selectedValues.code === item.code);
      }
      // Якщо selectedValues - простий тип (рядок/число), порівнюємо безпосередньо
      return selectedValues === item;
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.centeredView} onPress={onClose}>
        <TouchableWithoutFeedback>
          {/* Зупиняємо розповсюдження події натискання, щоб не закривати модалку при натисканні на її вміст */}
          <View style={styles.modalView(width)} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollView}>
              {options.map((item, index) => {
                const isItemSelected = isOptionSelected(item); // Використовуємо нову функцію

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      isItemSelected && styles.optionItemSelected,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      // Для одиночного вибору, закриваємо модалку одразу
                      if (!isMultiSelect) {
                        onClose();
                      }
                    }}
                  >
                    {renderItem ? (
                      // Якщо передано renderItem, використовуємо його для кастомного відображення
                      renderItem(item, isItemSelected)
                    ) : (
                      // Стандартне відображення, якщо renderItem не передано
                      <View style={styles.defaultOptionContent}>
                        {item.emoji && <Text style={styles.optionEmoji}>{item.emoji}</Text>}
                        <Text style={styles.optionName}>
                          {t(item.nameKey || item.name || item.toString())}
                        </Text>
                      </View>
                    )}
                    {isMultiSelect && isItemSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#0EB3EB"
                        style={styles.checkmarkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: (width) => ({
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20, // Зменшив padding для кращого вигляду з inner padding
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.8,
  }),
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    // fontFamily: "Mont-Bold", // Розкоментуйте, якщо шрифти завантажені
    flex: 1, // Дозволяє заголовку займати більше місця
    textAlign: 'center', // Центрування заголовка
    marginRight: 24, // Відступ від кнопки закриття
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    width: "100%",
  },
  defaultOptionContent: { // Додано для базового відображення опцій
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Дозволяє контенту займати доступне місце
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    borderRadius: 10, // Додано для візуальної відповідності `optionItemSelected`
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  optionName: {
    fontSize: 18,
    flex: 1,
    color: "#333",
    // fontFamily: "Mont-Regular", // Розкоментуйте, якщо шрифти завантажені
  },
  optionItemSelected: {
    backgroundColor: "rgba(14, 179, 235, 0.1)",
  },
  checkmarkIcon: {
    marginLeft: 10,
  },
});

export default ModalPicker;