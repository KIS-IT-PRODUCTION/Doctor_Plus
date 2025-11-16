import { StyleSheet, Platform, StatusBar } from 'react-native';

 export const COLORS = {
  primary: '#0EB3EB',
  background: '#F4F7F8',
  card: '#FFFFFF',
  text: '#212121',
  secondaryText: '#757575',
  border: '#ECECEC',
  danger: '#D32F2F',
  lightBlue: 'rgba(14, 179, 235, 0.1)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  grey: '#B0BEC5',
  lightGrey: '#f0f0f0',
  green: '#4CAF50',
  orange: 'rgba(241, 179, 7, 0.66)',
  darkRed: '#FF3B30',
};

export const getStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Mont-Regular"
  },
  container: {
    flex: 1, 
    gap: 16,
  },
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  backButton: {
    backgroundColor: COLORS.card,
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontFamily: "Mont-SemiBold",
    color: COLORS.text,
    textAlign: "center",
    flex: 1,
  },
  languageDisplayContainer: {
    width: 48,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  languageDisplayText: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: COLORS.white
  },
  statusSectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  // 👇 ОНОВЛЕНА ЛОГІКА ДЛЯ 3 СТАТУСІВ
  doctorStatusContainer: (type) => {
    let backgroundColor;
    switch (type) {
      case 'confirmed':
        backgroundColor = COLORS.green;
        break;
      case 'pending':
        backgroundColor = COLORS.orange;
        break;
      case 'draft':
      default:
        backgroundColor = COLORS.grey;
        break;
    }

    return {
      backgroundColor: backgroundColor,
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 8,
      elevation: 2,
      shadowColor: COLORS.black,
      shadowOpacity: 0.1,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 }
    };
  },
  doctorStatusText: {
    fontSize: 14,
    fontFamily: "Mont-Bold",
    color: COLORS.white
  },
  statusInfoIcon: {
    marginLeft: 12
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Mont-Bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Mont-Medium",
    color: COLORS.secondaryText,
    marginBottom: 4,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    paddingHorizontal: 15,
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.transparent,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Mont-Regular",
    color: COLORS.text,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
  },
  fieldErrorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontFamily: "Mont-Regular",
    marginTop: 4,
    marginLeft: 8,
  },
  selectButton: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    minHeight: 52,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.transparent,
  },
  selectButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Mont-Medium"
  },
  selectButtonPlaceholder: {
    color: COLORS.grey,
    fontSize: 16,
    fontFamily: "Mont-Medium"
  },
  selectButtonTextExpanded: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Mont-Medium",
    flexWrap: "wrap"
  },
  avatarUploadContainer: {
    alignItems: "center",
    gap: 15,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightGrey,
  },
  profileAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.lightGrey,
    justifyContent: "center",
    alignItems: "center"
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 555,
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Mont-Medium"
  },
  uploadContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    resizeMode: "cover",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labelWithIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoIcon: {
    padding: 5,
  },
  agreementContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 5,
    marginTop: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.transparent,
  },
  agreementTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  agreementText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "Mont-Regular",
    color: "#337AB7",
    marginLeft: 4, 
  },
privacyPolicyText: {
    fontSize: 14,
    lineHeight: 18,
    color: "black",
    fontFamily: "Mont-SemiBold",
  },
  saveProfileButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 555,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveProfileButtonDisabled: {
    backgroundColor: COLORS.grey,
  },
  saveProfileButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Mont-Bold",
  },

  centeredView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  modalView: {
    margin: 20,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%"
  },
  modalBorder: {
    borderColor: COLORS.primary,
    borderWidth: 1
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Mont-Bold',
    marginBottom: 15,
    textAlign: 'center',
    color: COLORS.text,
  },
  modalScrollView: {
    width: "100%"
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  countryEmoji: {
    fontSize: 24,
    marginRight: 15
  },
  countryName: {
    fontSize: 18,
    flex: 1,
    fontFamily: 'Mont-Regular',
    color: COLORS.text,
  },
  countryItemSelected: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 10
  },
  countryItemTextSelected: {
    fontFamily: "Mont-Bold",
    color: COLORS.primary
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: "100%"
  },
  buttonClose: {
    backgroundColor: COLORS.primary
  },
  textStyle: {
    color: COLORS.white,
    fontFamily: 'Mont-Bold',
    textAlign: "center"
  },
  languageModalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: "80%",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "60%"
  },
  languageOption: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: COLORS.text
  },
  checkmarkIcon: {
    marginLeft: 10
  },
  pickerScrollView: {
    width: "100%",
    maxHeight: 300
  },
  pickerOption: {
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  pickerOptionText: {
    fontSize: 18,
    fontFamily: "Mont-Regular",
    color: COLORS.text
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 10
  },
  modalContentYears: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  fullScreenImageModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center"
  },
  fullScreenImage: {
    width: "100%",
    height: "100%"
  },
  closeImageModalButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    zIndex: 1
  },
  infoModalText: {
    fontSize: 15,
    fontFamily: "Mont-Regular",
    color: COLORS.text,
    textAlign: "left",
    width: "100%",
    marginBottom: 12,
    lineHeight: 22
  },
  deleteModalView: {
    paddingHorizontal: 20,
    paddingVertical: 30
  },
  deleteInput: {
    backgroundColor: "rgba(255, 0, 0, 0.05)",
    marginBottom: 10,
    borderColor: COLORS.danger,
    borderWidth: 1,
    color: COLORS.text,
    width: '100%',
    paddingVertical: 4,
    paddingHorizontal: 15,
    fontFamily: 'Mont-Regular',
    borderRadius: 8,
    fontSize: 16,
    lineHeight: 28,
  },signOutButton: {
    flex: 1,
    backgroundColor: COLORS.transparent,
    borderRadius: 30,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderWidth: 1,
    borderColor: '#B0BEC5', 
  },
  signOutButtonText: {
    color: '#424242',
    fontSize: 16,
    fontFamily: "Mont-Bold",
    marginLeft: 8,
  },
  deleteProfileButton: {
    flex: 1,
    backgroundColor: COLORS.transparent,
    borderRadius: 30,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.danger,
    flexDirection: 'row',
  },
  deleteButton: {
    backgroundColor: COLORS.darkRed,
  },
  deleteProfileButtonText: {
    color: COLORS.danger,
    fontSize: 16, 
    fontFamily: "Mont-Bold",
    marginLeft: 8,
  },
  buttonRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
    marginBottom: 70,
    gap: 15,
  },
});