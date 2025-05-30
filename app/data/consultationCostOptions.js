// data/consultationCostOptions.js
export const generateConsultationCostOptions = () => {
  const options = [];
  for (let i = 10; i <= 200; i += 5) {
    options.push(i);
  }
  return options;
};

export const consultationCostOptions = generateConsultationCostOptions();