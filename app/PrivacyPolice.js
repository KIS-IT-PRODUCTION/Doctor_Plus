import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get("window");

const getResponsiveFontSize = (baseSize) => {
  const scale = width / 400;
  const newSize = baseSize * scale;
  return Math.round(newSize);
};

const getResponsiveHeight = (percent) => {
  return height * (percent / 100);
};

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };
  
  // Функція для заміни плейсхолдерів
  const replacePlaceholders = (text) => {
    const appName = "My Health App"; // Замініть на реальну назву вашого додатку
    const companyName = "ТОВ «DoctorPlus»"; // Замініть на реальну назву вашої компанії
    const companyAddress = "м. Київ, вул. Прикладна, 1"; // Замініть на реальну адресу
    const companyCode = "12345678"; // Замініть на реальний код ЄДРПОУ
    const companyEmail = "support@yourdomain.me"; // Замініть на реальну пошту

    return text
      .replace(/ТОВ «____________»/g, companyName)
      .replace(/«_________»/g, appName)
      .replace(/_________/g, appName)
      .replace(/____________________/g, companyAddress)
      .replace(/_______________/g, companyCode)
      .replace(/Support@_________.me/g, companyEmail);
  };
  
  const policyText = {
    uk: `
  ПОВІДОМЛЕННЯ ПРО ОБРОБКУ ПЕРСОНАЛЬНИХ ДАНИХ
  
  Повідомлення про обробку персональних даних
  Відповідно до пунктів 1 і 2 частини другої статті 8, частини другої статті 12 Закону України «Про захист персональних даних» Товариство з обмеженою відповідальністю «____________» повідомляє про володільця, розпорядника, місцезнаходження, склад і мету збору персональних даних, що обробляються за допомогою програмних засобів в інформаційно-комунікаційній системі “_______” (в тому числі - мобільному додатку ________), третіх осіб, яким передаються такі персональні дані, та права суб'єкта персональних даних.
  
  Володільцем персональних даних, що обробляються в ________ є ТОВ “_______” (компанія, що створена та існує за законодавством України, зареєстрована за адресою: ____________________. Ідентифікаційний код юридичної особи в Єдиному державному реєстрі підприємств і організацій України – _______________).
  
  Персональні дані будуть включені до Бази персональних даних «_________» (далі — База персональних даних).
  
  Порядок збору персональних даних передбачає, що у _________ зберігається інформація, яка була внесена у систему під час взаємодії з _________, наприклад, через кабінет користувача (обліковий запис), коли Ви самостійно вносите дані або вчиняєте певні дії (запис на прийом, замовлення тощо), під час внесення інформації лікарем або іншим спеціалістом, який надає Вам медичну допомогу або медичні послуги тощо. Також збір персональних даних можливий під час звернення до нашого call-центру.
  
  Ми можемо отримувати інформацію про Вас (в тому числі: медичні записи, записи про направлення, рецепти, медичні висновки, записи про декларації тощо), яка зберігається в реєстрах, що ведуться у центральній базі даних у наступних випадках:
  
  • Якщо Ваш сімейний лікар або лікар, який надає Вам медичну допомогу або медичні послуги, використовує для доступу до інформації у центральній базі даних _________;
  • Якщо інформація, яка зберігається у реєстрах, що ведуться центральній базі даних, була внесена за допомогою _________.
  
  Також ми можемо зберегти Ваші дані або створити профіль (обліковий запис) у випадку, якщо Ви доручили (надали згоду) це зробити третім особам.
  
  У випадку автоматизованої передачі копій цифрових документів за допомогою єдиного державного веб-порталу електронних послуг «Портал Дія», така передача відбувається виключно на підставі наданої Вами згоди (з використанням мобільного додатку Порталу Дія) у порядку, визначеному чинним законодавством. Ваші персональні дані отримуються ТОВ “_________” з метою, визначеною цим Повідомленням від Технічного адміністратора Порталу Дія (Державне підприємство «ДІЯ») з яким у нас укладено відповідний договір.
  
  Ви маєте можливість дозволити нам імпортувати дані зі сторонніх служб та/або пристроїв, таких як Apple HealthKit та Google Fit (далі - треті сторони).
  
  Ви самостійно вирішуєте, які дані будуть отримуватися _________ від третіх сторін. Для цього Вам необхідно надати відповідні дозволи у Вашому пристрої (додатках). Дозвіл на отримання інформації від третіх сторін може допомогти Вам покращити використання _________.
  
  Ви можете будь-коли відкликати такий дозвіл у Apple HealthKit та Google Fit або налаштувати його відповідно до Ваших потреб.
  
  Ви можете відмовитись надавати інформацію про себе або звернутися до нас з вимогою про видалення вже внесеної інформації.
  
  Ми не маємо права або технічної можливості видалити інформацію, що внесена в реєстри центральної бази даних електронної системи охорони здоров’я (тобто все, що стосується декларацій про вибір лікаря, електронних направлень, електронних рецептів, внесених у реєстри та медичних послуг і ліків, які оплачуються з державного бюджету). Для зміни таких відомостей Вам необхідно звернутися до Національної служби здоров’я України, яка є володільцем інформації, що зберігається у реєстрах центральної бази даних.
  
  До складу персональних даних можуть включатися:
  
  1) Дані, необхідні для реєстрації та ведення облікового запису:
  • прізвище, ім’я, по батькові;
  • стать;
  • дата народження;
  • паспортні дані;
  • реєстраційний номер облікової картки платника податків (за наявності);
  • адреса зареєстрованого місця проживання та/або місце проживання;
  • засоби зв’язку, такі як адреса електронної пошти і номер телефону;
  • IP адреси;
  • інші дані, які вносяться у _________ або інформація про дії, здійснені у системі;
  • інформація про умови страхового полісу у разі його наявності, зокрема період дії договору, страхова сума та страховий платіж;
  • дані про повʼязаних осіб (у випадку, коли вказані користувачами або є опікунами чи піклувальниками), зокрема ПІБ, стать, дата народження, та інша інформація в документі, що засвідчує звʼязок;
  • пільгові категорії
  • місце розташування мобільного пристрою та інші унікальні ідентифікатори пристрою
  • фотографія.
  
  Ви можете отримати в _________ Пам’ятку про отримане щеплення. Звертаємо Вашу увагу, що така пам’ятка не є офіційним документом чи сертифікатом та призначена для використання Вами в особистих цілях (наприклад, якщо Ви хочете мати відомості про проведену вакцинацію, які були внесені в електронну систему охорони здоровʼя, в паперовому вигляді). Ми не передаємо таку форму жодним третім особам не не використовуємо її в будь-яких цілях крім тих, що зазначені у розділі “Дані щодо вакцинації від Covid-19” цього Повідомлення.
  
  4) Дані, отримані від третіх сторін
  Залежно від наданих Вами дозволів та обсягу інформації, доступної у відповідному додатку (Apple HealthKit, Google Fit або Health Connect), у _________ може оброблятися наступна інформація, отримана від третіх сторін: вага, зріст, обхват талії, відсоток жиру в організмі, температура, артеріальний тиск, пульс, пульс у стані спокою, рівень глюкози в крові, індекс маси тіла, частота дихання, об'єм легень, сатурація крові киснем (оксигенація), кількість кроків, хвилини активності (активність), спалені калорії, сон, спожиті калорії, гідратація тощо.
  
  Зазначені відомості також можуть бути внесені Вами самостійно.
  
  Такі дані будуть відображатися у Вашому обліковому записі та стануть доступними для ознайомлення під час використання Вами додатку. Також вони можуть використовуватись для надання Вам довідкових рекомендацій, формування індивідуальних інформаційних звітів, забезпечення можливості аналізу даних тощо. Такі відомості надаються Вам для довідки та загального ознайомлення.
  
  Ми не надаємо Вам жодних медичних рекомендацій, але Ви можете використовувати отриману інформацію для прийняття певних обґрунтованих рішень.
  
  Використання фотографії здійснюється на Ваш розсуд. Ви самі вирішуєте завантажувати фотографію чи ні. Якщо Ви вирішили це зробити, Ваше фото буде зберігатися у системі для ведення облікового запису в _________. Ми гарантуємо, що це єдиний спосіб використання нами Вашого зображення.
  
  Отримання доступу до деяких даних на Вашому пристрої необхідне для певного функціоналу _________, зокрема це доступ до:
  
  • місця розташування для того, щоб показати Вам найближчі аптеки;
  • камери та мікрофону для здійснення відеодзвінку з Вашим лікарем під час онлайн консультації;
  • bluetooth, якщо під час онлайн консультації з лікарем Ви використовуєте бездротову гарнітуру;
  • внутрішнього сховища Вашого пристрою/камери у разі завантаження файлів або фотографій до електронної медичної картки, яка ведеться у _________;
  • календаря, щоб додати у нього інформацію про запис до лікаря.
  
  Ви можете заборонити доступ _________ до таких даних в налаштуваннях Вашого пристрою. Якщо Ви не надасте дозвіл у таких випадках, ми не матимемо змогу надати відповідний функціонал.
  
  Захист персональних даних є пріоритетом для _________. Відповідно до вимог, встановлених Законом України “Про захист інформації в інформаційно-комунікаційних системах”/
  
  Всі персональні дані, внесені в систему, шифруються або знеособлюються (тобто з них вилучаються відомості, які дають змогу прямо чи опосередковано ідентифікувати особу) у випадках, коли таке знеособлення не призводить до неможливості надавати користувачам послуги.
  
  Персональні дані з Бази персональних даних обробляються в _________ автоматично, при цьому їх зберігання здійснюється у зашифрованому або знеособленому вигляді, що виключає можливість ідентифікувати особу.
  
  Наші працівники отримують доступ до ваших персональних даних (будь-яких) лише у виняткових випадках, наприклад, якщо ви самі звернулись до нашого call-центра; у випадку, якщо Ви залишили свої контакти в певному опитуванні або під час проведення певної акції (ми обовʼязково попередимо Вас про можливість такого доступу до персональних даних); на підставі судового рішення тощо. Такі працівники обов’язково надали письмове зобов’язання про нерозголошення персональних даних, які їм було довірено або які стали їм відомі у зв’язку з виконанням професійних чи посадових обов’язків. Кожен такий факт доступу до персональних даних фіксується та зберігається.
  
  Персональні дані можуть передаватися:
  
  • закладам охорони здоров’я та фізичним особам-підприємцям (лікарям), що отримали ліцензію на провадження господарської діяльності з медичної практики (тобто мають ліцензію від МОЗ) виключно для отримання Вами медичної допомоги або медичних послуг;
  • органу, уповноваженому відповідно до чинного законодавства України, на ведення Реєстру пацієнтів, Реєстру медичних записів, записів про направлення та рецептів, Реєстру медичних висновків тощо (якщо інформація має бути передана відповідно до законодавства), а також володільцям інших реєстрів, створених відповідно до законодавства України, якщо інформація про Вас має бути туди передана та відповідає його призначенню (це може бути Єдина державна база даних медичних оглядів певних категорій осіб в системі охорони здоров’я, якщо Ви проходите професійний медогляд тощо), зокрема відповідно до постанови Кабінету Міністрів України №411 від 25 квітня 2018 року “Деякі питання електронної системи охорони здоров’я, наказу Міністерства охорони здоровʼя України №587 від 28 лютого 2020 року “Деякі питання ведення Реєстру медичних записів, записів про направлення та рецептів в електронній системі охорони здоров’я”, наказу Міністерства охорони здоровʼя № 2136 від 18 вересня 2020 року “Деякі питання ведення Реєстру медичних висновків в електронній системі охорони здоров'я;
  • іншим особам, визначеним Вами особисто, в разі звернення до таких осіб (тобто запису за допомогою _________, оформлення за допомогою _________ отримання певних послуг, укладання за допомогою _________ договорів, вчинення інших дій за допомогою _________ тощо). При цьому звертаємо увагу, що передача можлива виключно у зв’язку з Вашими активними діями (тобто Ваше звернення завжди передує передачі даних);
  
  Якщо Ви записалися на прийом до лікаря або іншу послугу використовуючи _________, ми можемо передати інформацію про такий запис надавачу послуг електронною поштою. У цьому випадку буде передано тільки Ваше прізвище, ім'я, по батькові та контактний телефон. Ця інформація надається виключно з метою полегшення Вашого запису або обслуговування
  
  Для здійснення розсилок (як авторизаційних, так і інформаційних), Ваш абонентський номер телефону може передаватися особам, з якими у нас підписано відповідні договори, та які включені до реєстру постачальників електронних комунікаційних мереж та послуг. Ваш абонентський номер телефону не буде співставлятися з жодними іншими базами даних, незалежно від їх володільця, що виключає будь-яку ідентифікацію Вашої особи.
  
  За допомогою (з використанням) номеру телефону Вам може бути надано інформацію (в т.ч. рекламну) відповідно до умов та мети, зазначених у цьому Повідомленні.
  
  Ви також надаєте свою згоду ТОВ "_________" передавати та отримувати у оператора електронних комунікаційних послуг, що надає послуги мобільного зв’язку та оброблює дані, що пов'язані з наданням таких послуг, інформацію про телекомунікаційні послуги та/або Ваше місцезнаходження і номер телефону, необхідні для для наступної мети обробки даних: ведення профілю користувача, надання рекомендацій та інформації.
  
  Одночасно, Ви надаєте згоду відповідному оператору електронних комунікаційних послуг на обробку та передачу нам інформації про електронні комунікаційні послуги та Ваше місцезнаходження.
  
  Публікуючи відгук у _________, Ви погоджуєтесь виконувати Правила публікації та модерації відгуків і коментарів, які доступні для ознайомлення у _________.
  
  Ви також надаєте згоду на публікацію Вашого імені або ПІБ та тексту такого відгуку (якщо не проставлена відмітка про публікацію анонімного відгуку).
  
  Ви підтверджуєте розуміння того, що публікація відгуку може прямо або опосередковано підтвердити (розголосити) факт Вашого звернення за медичною допомогою. У випадку, якщо відгук містить відомості про стан Вашого здоровʼя, Ви самостійно приймаєте рішення про публікацію таких відомостей та надаєте ТОВ “________” згоду на їх поширення (яка підтверджується фактом публікації відгуку, написаного Вами).
  
  Ви також надає дозвіл лікарю або закладу охорони здоровʼя залишити коментар до такого відгуку, який може прямо або опосередковано підтвердити факт звернення за медичною допомогою. Звертаємо Вашу увагу, що лікар або заклад охорони здоровʼя не мають права розголошувати інформацію про стан Вашого здоровʼя.
  
  Передача (поширення) персональних даних у випадках, зазначених в цьому Повідомленні, здійснюється без отримання додаткової згоди та окремого повідомлення суб‘єкта персональних даних.
  
  Метою збору персональних даних є надання якісних та своєчасних послуг користування _________, забезпечення безперервного, повноцінного та точного функціонування системи для Вашої зручності.
  
  Час від часу ми будемо надсилати Вам інформаційні повідомлення від нас, тобто дзвінки, СМС, e-mail, повідомлення безпосередньо у _________ (в т.ч. push-повідомлення), у Viber та інших месенджерах тощо. Це необхідно для реєстрації, авторизації та, підтвердження певних дій у _________. Ви не можете відмовитися від таких дій, оскільки це необхідно для звичайного функціонування сайту і додатку.
  
  Крім того, ми можемо надсилати вам інформацію, що стосується сфери медицини та фармакології/фармації або іншу інформацію, яка може бути Вам потрібною або цікавою.
  
  Ми також можемо надсилати Вам інформаційні або рекламні повідомлення (СМС, e-mail, Viber тощо) від імені наших надійних партнерів, якщо зміст таких повідомлень відповідає меті обробки, вказаній у цьому Повідомленні.
  
  Ви можете відмовитися від отримання інших інформаційних повідомлень звʼязавшись з нашою командою одним з наступних способів:
  
  1. скориставшись формою для зворотнього зв’язку у _________;
  2. відправивши лист на електронну пошту Support@_________.me;
  3. відправивши лист на нашу адресу: _____
  
  Згідно з частиною другою статті 8 Закону України «Про захист персональних даних» суб'єкт персональних даних має право:
  
  • знати про джерела збирання, місцезнаходження своїх персональних даних, мету їх обробки, місцезнаходження або місце проживання (перебування) власника чи розпорядника персональних даних або дати відповідне доручення щодо отримання цієї інформації уповноваженим ним особам, крім випадків, встановлених законом;
  • отримувати інформацію про умови надання доступу до персональних даних, зокрема інформацію про третіх осіб, яким передаються Ваші персональні дані;
  • на доступ до своїх персональних даних;
  • отримувати не пізніш як за тридцять календарних днів (30) з дня надходження запиту, крім випадків, передбачених законом, відповідь про те, чи обробляються Ваші персональні дані, а також отримувати зміст таких персональних даних;
  • пред’являти вмотивовану вимогу власнику персональних даних із запереченням проти обробки своїх персональних даних;
  • пред’являти вмотивовану вимогу щодо зміни або видалення своїх персональних даних будь-яким власником та розпорядником персональних даних, якщо ці дані обробляються незаконно чи є недостовірними;
  • на захист своїх персональних даних від незаконної обробки та випадкової втрати, знищення, пошкодження у зв’язку з умисним приховуванням, ненаданням чи несвоєчасним їх наданням, а також на захист від надання відомостей, що є недостовірними чи ганьблять честь, гідність та ділову репутацію фізичної особи;
  • звертатися із скаргами на обробку своїх персональних даних до Уповноваженого Верховної Ради з прав людини або до суду;
  • застосовувати засоби правового захисту в разі порушення законодавства про захист персональних даних;
  • вносити застереження стосовно обмеження права на обробку своїх персональних даних під час надання згоди;
  • відкликати згоду на обробку персональних даних;
  • знати механізм автоматичної обробки персональних даних;
  • на захист від автоматизованого рішення, яке має для нього правові наслідки.
  
  Для реалізації своїх прав Ви можете звернутися до нас:
  
  • скориставшись формою для зворотнього зв’язку у _________;
  • відправивши лист на електронну пошту Support@_________.me;
  • відправивши лист на нашу адресу: _____
  
  Строк обробки та видалення персональних даних визначаються відповідно до законодавства та Вашої згоди на обробку персональних даних, умови якої викладені в цьому повідомленні.
  
  Персональні дані зберігаються у _________ весь час, протягом якого Ви використовуєте систему.
  
  Якщо нами буде отримано інформацію, що підтверджується відповідними доказами, про внесення у систему недостовірної інформації, порушення при використанні _________ Угоди користувача або цього повідомлення, використанні для реєстрації засобів зв’язку, що належать третім особам або реєстрації третіх осіб без достатніх повноважень, ТОВ “______” залишає за собою право без попереднього повідомлення заблокувати обліковий запис, щодо якого були виявлені такі відомості, на час проведення перевірки.
  
  За результатами перевірки, у випадку встановлення факту внесення у систему недостовірної інформації, порушенні при використанні _________ Угоди користувача або цього повідомлення, використанні для реєстрації засобів зв’язку, що належать третім особам або реєстрації третіх осіб без достатніх повноважень (або неможливості спростувати такі факти), може бути прийнято рішення про видалення недостовірної інформації або видалення облікового запису, щодо якого були виявлені такі факти, в цілому без можливості подальшого відновлення (у випадку внесення недостовірних даних щодо засобів зв’язку (які використовуються як один із ідентифікаторів у _________), ПІБ, або якщо обсяг залишеної після видалення недостовірної інформації не дозволяє сформувати обліковий запис користувача), про що особа, яка створила такий обліковий запис, може повідомлятися у випадку, якщо у нас наявна інформація про засоби зв’язку нею.
  
  Блокування або видалення облікового запису в _________ не впливає на інформацію, що внесена в реєстри центральної бази даних електронної системи охорони здоров’я (тобто все, що стосується декларацій про вибір лікаря, електронних направлень, електронних рецептів, внесених у реєстри та інших медичних послуг та ліків, які оплачуються з державного бюджету, відомості про які зберігаються у відповідних державних реєстрах).
  
  Інформація, що обробляється у _________, не збирається нами самостійно, а вноситься Вами, Вашим лікарем або іншою особою, що надає Вам медичну допомогу або медичні послуги.
  
  Також інформація про вас може бути отримана (передана) у випадках, прямо передбачених цією згодою. При цьому порядок збору персональних даних залишається незмінним, це відомості, які вносились у _________ Вами, Вашим лікарем або іншою особою, що надає Вам медичну допомогу або медичні послуги та/або визначена в цьому повідомленні.
  
  Прикінцеві положення
  
  Функціонал _________ та послуги за допомогою системи можуть бути надані в повному обсязі лише якщо попередньо ми отримаємо від Вас згоду на обробку персональних даних.
  
  З можливостями _________ які доступні без авторизації (надання згоди на обробку персональних даних) Ви можете ознайомитись в Угоді користувача, що доступна на сайті або в мобільному додатку _________.
  
  Зміни та доповнення до цього повідомлення про обробку персональних даних вносяться шляхом оформлення їх нової редакції в електронній формі, яка оприлюднюються у _________.
  
  Датою набрання чинності нової редакції повідомлення про обробку персональних даних є дата їх оприлюднення у _________. Ми обов’язково повідомимо Вас про такі зміни шляхом запиту про надання нової згоди на обробку персональних даних (відповідно до умов нової редакції повідомлення про обробку персональних даних).
  
  У випадку неприйняття (непогодження) такої нової редакції просимо Вас припинити використання _________ та нагадуємо, що Ви маєте право у встановленому законодавством порядку пред’явити вимогу про знищення Ваших персональних даних внесених у _________.
  
  `,
    en: `
  NOTICE ON PERSONAL DATA PROCESSING
  
  Notice on Personal Data Processing
  In accordance with paragraphs 1 and 2 of part two of Article 8, part two of Article 12 of the Law of Ukraine "On Personal Data Protection", the Limited Liability Company "____________" hereby notifies about the owner, data controller, location, composition, and purpose of personal data collection, which are processed using software in the information and communication system "_______" (including the mobile application ________), third parties to whom such personal data are transferred, and the rights of the personal data subject.
  
  The owner of the personal data processed in the ________ is LLC "_______" (a company established and existing under the laws of Ukraine, registered at: ____________________. Identification code of the legal entity in the Unified State Register of Enterprises and Organizations of Ukraine – _______________).
  
  Personal data will be included in the Personal Data Base «_________» (hereinafter — the Personal Data Base).
  
  The procedure for collecting personal data assumes that the _________ stores information that was entered into the system during interaction with _________, for example, through the user's account, when you independently enter data or perform certain actions (appointment booking, orders, etc.), or when information is entered by a doctor or other specialist providing you with medical care or medical services. The collection of personal data is also possible when contacting our call center.
  
  We may receive information about you (including: medical records, referral records, prescriptions, medical opinions, declaration records, etc.) that is stored in the registers maintained in the central database in the following cases:
  
  • If your family doctor or a doctor providing you with medical care or medical services uses the _________ to access information in the central database;
  • If the information stored in the registers maintained in the central database was entered using the _________.
  
  We may also save your data or create a profile (account) if you have instructed (given consent to) third parties to do so.
  
  In the case of automated transfer of copies of digital documents through the single state web portal of electronic services "Diia Portal," such transfer occurs solely on the basis of your consent (using the mobile application of the Diia Portal) in the manner prescribed by current legislation. Your personal data is received by LLC "_________" for the purpose defined by this Notice from the Technical Administrator of the Diia Portal (State Enterprise "DIIA") with whom we have a relevant agreement.
  
  You have the option to allow us to import data from third-party services and/or devices, such as Apple HealthKit and Google Fit (hereinafter - third parties).
  
  You independently decide which data will be received by _________ from third parties. To do this, you need to provide the appropriate permissions in your device (applications). Allowing the receipt of information from third parties can help you improve your use of _________.
  
  You can withdraw such permission at any time in Apple HealthKit and Google Fit or configure it according to your needs.
  
  You can refuse to provide information about yourself or contact us with a request to delete already entered information.
  
  We have no right or technical ability to delete information entered into the registers of the central database of the electronic health care system (i.e., everything related to declarations of doctor choice, electronic referrals, electronic prescriptions entered into the registers, and medical services and medicines paid for from the state budget). To change such information, you must contact the National Health Service of Ukraine, which is the owner of the information stored in the registers of the central database.
  
  The personal data may include:
  
  1) Data required for account registration and maintenance:
  • surname, first name, patronymic;
  • gender;
  • date of birth;
  • passport data;
  • taxpayer registration card number (if any);
  • address of registered place of residence and/or place of residence;
  • means of communication, such as email address and phone number;
  • IP addresses;
  • other data entered into the _________ or information about actions taken in the system;
  • information about the terms of the insurance policy, if any, including the period of the contract, the sum insured, and the insurance premium;
  • data about related persons (in cases where they are specified by users or are guardians or trustees), including full name, gender, date of birth, and other information in the document certifying the relationship;
  • preferential categories
  • mobile device location and other unique device identifiers
  • photo.
  
  You can receive in the _________ a Memo on the vaccination received. Please note that such a memo is not an official document or certificate and is intended for your personal use (for example, if you want to have information about the vaccination performed, which was entered into the electronic health care system, in paper form). We do not transfer such a form to any third parties and do not use it for any purposes other than those specified in the "Data on Covid-19 Vaccination" section of this Notice.
  
  4) Data received from third parties
  Depending on the permissions you provide and the amount of information available in the relevant application (Apple HealthKit, Google Fit, or Health Connect), the following information may be processed in the _________, received from third parties: weight, height, waist circumference, body fat percentage, temperature, blood pressure, pulse, resting heart rate, blood glucose level, body mass index, respiratory rate, lung volume, blood oxygen saturation (oxygenation), number of steps, activity minutes (activity), calories burned, sleep, calories consumed, hydration, etc.
  
  The specified information can also be entered by you yourself.
  
  Such data will be displayed in your account and will become available for review while you use the application. They may also be used to provide you with reference recommendations, generate individual information reports, enable data analysis, etc. Such information is provided to you for reference and general review.
  
  We do not provide you with any medical recommendations, but you can use the received information to make certain informed decisions.
  
  The use of a photo is at your discretion. You decide whether to upload a photo or not. If you decide to do so, your photo will be stored in the system for maintaining your account in the _________. We guarantee that this is the only way we use your image.
  
  Obtaining access to certain data on your device is necessary for certain functionality of the _________, including access to:
  
  • location to show you the nearest pharmacies;
  • camera and microphone to make a video call with your doctor during an online consultation;
  • bluetooth, if you use a wireless headset during an online consultation with a doctor;
  • internal storage of your device/camera in case of uploading files or photos to the electronic medical card that is maintained in the _________;
  • calendar, to add information about an appointment with a doctor to it.
  
  You can deny the _________ access to such data in your device's settings. If you do not give permission in such cases, we will not be able to provide the corresponding functionality.
  
  Personal data protection is a priority for _________. In accordance with the requirements established by the Law of Ukraine "On Information Protection in Information and Communication Systems"/
  
  All personal data entered into the system are encrypted or anonymized (i.e., information that allows direct or indirect identification of a person is removed from it) in cases where such anonymization does not lead to the impossibility of providing services to users.
  
  Personal data from the Personal Data Base is processed automatically in the _________, while its storage is carried out in an encrypted or anonymized form that excludes the possibility of identifying a person.
  
  Our employees get access to your personal data (any) only in exceptional cases, for example, if you yourself contact our call center; in case you leave your contacts in a certain survey or during a certain promotion (we will definitely warn you about the possibility of such access to personal data); on the basis of a court decision, etc. Such employees have necessarily provided a written commitment not to disclose personal data entrusted to them or that became known to them in connection with the performance of their professional or official duties. Each such fact of access to personal data is recorded and stored.
  
  Personal data may be transferred to:
  
  • healthcare facilities and private entrepreneurs (doctors) who have obtained a license to conduct economic activities in medical practice (i.e., have a license from the Ministry of Health) solely for you to receive medical care or medical services;
  • the body authorized in accordance with current legislation of Ukraine to maintain the Register of Patients, the Register of Medical Records, referral and prescription records, the Register of Medical Opinions, etc. (if the information must be transferred in accordance with legislation), as well as to owners of other registers created in accordance with the legislation of Ukraine, if information about you must be transferred there and corresponds to its purpose (this may be the Unified State Database of Medical Examinations of certain categories of persons in the health care system, if you undergo a professional medical examination, etc.), in particular in accordance with the resolution of the Cabinet of Ministers of Ukraine №411 of April 25, 2018 "Some issues of the electronic health care system," the order of the Ministry of Health of Ukraine №587 of February 28, 2020 "Some issues of maintaining the Register of Medical Records, referral and prescription records in the electronic health care system," the order of the Ministry of Health №2136 of September 18, 2020 "Some issues of maintaining the Register of Medical Opinions in the electronic health care system;
  • other persons designated by you personally, in case of contacting such persons (i.e., booking using _________, filling out using _________ receiving certain services, concluding using _________ contracts, performing other actions using _________ etc.). In this case, we draw your attention to the fact that the transfer is possible only in connection with your active actions (i.e., your request always precedes the transfer of data);
  
  If you have booked an appointment with a doctor or another service using _________, we may transfer information about such a booking to the service provider by email. In this case, only your surname, first name, patronymic, and contact phone number will be transferred. This information is provided solely for the purpose of facilitating your booking or service
  
  For sending mailings (both authorization and informational), your subscriber's phone number may be transferred to persons with whom we have signed relevant agreements and who are included in the register of providers of electronic communication networks and services. Your subscriber's phone number will not be cross-referenced with any other databases, regardless of their owner, which excludes any identification of your person.
  
  Using (with the use of) a phone number, you may be provided with information (including advertising) in accordance with the terms and purpose specified in this Notice.
  
  You also give your consent to LLC "_________" to transfer and receive from an operator of electronic communication services that provides mobile communication services and processes data related to the provision of such services, information about telecommunication services and/or your location and phone number, necessary for the following purpose of data processing: maintaining a user profile, providing recommendations and information.
  
  At the same time, you give consent to the relevant operator of electronic communication services to process and transfer to us information about electronic communication services and your location.
  
  By publishing a review in _________, you agree to comply with the Rules for publishing and moderating reviews and comments, which are available for review in _________.
  
  You also give consent to the publication of your name or full name and the text of such a review (if the box for anonymous publication is not checked).
  
  You confirm your understanding that the publication of a review may directly or indirectly confirm (disclose) the fact of your seeking medical care. If the review contains information about your health status, you independently decide to publish such information and give LLC "________" consent to its dissemination (which is confirmed by the fact of publishing the review written by you).
  
  You also give permission to a doctor or a healthcare facility to leave a comment on such a review, which may directly or indirectly confirm the fact of seeking medical care. Please note that a doctor or a healthcare facility has no right to disclose information about your health status.
  
  The transfer (dissemination) of personal data in the cases specified in this Notice is carried out without obtaining additional consent and a separate notification of the personal data subject.
  
  The purpose of collecting personal data is to provide high-quality and timely services for using _________, to ensure the continuous, complete, and accurate functioning of the system for your convenience.
  
  From time to time, we will send you informational messages from us, i.e., calls, SMS, e-mail, messages directly in the _________ (including push notifications), in Viber and other messengers, etc. This is necessary for registration, authorization, and confirmation of certain actions in the _________. You cannot refuse such actions, as this is necessary for the normal functioning of the website and application.
  
  In addition, we may send you information related to the field of medicine and pharmacology/pharmacy or other information that may be necessary or interesting to you.
  
  We may also send you informational or advertising messages (SMS, e-mail, Viber, etc.) on behalf of our trusted partners, if the content of such messages corresponds to the purpose of processing specified in this Notice.
  
  You can refuse to receive other informational messages by contacting our team in one of the following ways:
  
  1. using the feedback form in the _________;
  2. sending a letter to the email address Support@_________.me;
  3. sending a letter to our address: _____
  
  According to part two of Article 8 of the Law of Ukraine "On Personal Data Protection", the personal data subject has the right to:
  
  • know about the sources of collection, location of their personal data, the purpose of their processing, the location or place of residence (stay) of the owner or controller of personal data, or give an appropriate instruction to receive this information to persons authorized by them, except in cases established by law;
  • receive information about the conditions for providing access to personal data, in particular, information about third parties to whom your personal data are transferred;
  • access their personal data;
  • receive an answer about whether your personal data are being processed, no later than thirty (30) calendar days from the date of receipt of the request, except in cases provided by law, and also to receive the content of such personal data;
  • submit a reasoned demand to the owner of personal data with an objection to the processing of their personal data;
  • submit a reasoned demand for the change or deletion of their personal data by any owner and controller of personal data if these data are processed illegally or are unreliable;
  • protection of their personal data from illegal processing and accidental loss, destruction, damage due to intentional concealment, failure to provide or untimely provision, as well as protection from providing information that is unreliable or defames the honor, dignity, and business reputation of a natural person;
  • appeal against the processing of their personal data to the Authorized Person of the Verkhovna Rada for Human Rights or to the court;
  • apply legal remedies in case of violation of legislation on personal data protection;
  • make reservations regarding the restriction of the right to process their personal data when giving consent;
  • withdraw consent to the processing of personal data;
  • know the mechanism of automated processing of personal data;
  • protection from an automated decision that has legal consequences for them.
  
  To exercise your rights, you can contact us:
  
  • using the feedback form in the _________;
  • sending a letter to the email address Support@_________.me;
  • sending a letter to our address: _____
  
  The period of processing and deletion of personal data are determined in accordance with the legislation and your consent to the processing of personal data, the terms of which are set out in this notice.
  
  Personal data is stored in the _________ for the entire time you use the system.
  
  If we receive information, confirmed by relevant evidence, about the entry of unreliable information into the system, violation of the User Agreement or this notice when using _________, use of communication means belonging to third parties for registration, or registration of third parties without sufficient authority, LLC "______" reserves the right, without prior notice, to block the account for which such information was discovered for the duration of the verification.
  
  Based on the results of the verification, in case of establishing the fact of entering unreliable information into the system, violation of the User Agreement or this notice when using _________, use of communication means belonging to third parties for registration, or registration of third parties without sufficient authority (or the impossibility of refuting such facts), a decision may be made to delete the unreliable information or delete the account for which such facts were discovered entirely without the possibility of further restoration (in case of entering unreliable data regarding communication means (which are used as one of the identifiers in _________), full name, or if the amount of information remaining after the deletion of unreliable information does not allow for the formation of a user account), of which the person who created such an account may be notified if we have information about the communication means used by them.
  
  Blocking or deleting an account in the _________ does not affect the information entered into the registers of the central database of the electronic health care system (i.e., everything related to declarations of doctor choice, electronic referrals, electronic prescriptions entered into the registers, and other medical services and medicines paid for from the state budget, the information about which is stored in the relevant state registers).
  
  The information processed in the _________ is not collected by us independently, but is entered by you, your doctor, or another person providing you with medical care or medical services.
  
  Information about you can also be received (transferred) in cases expressly provided for by this consent. In this case, the procedure for collecting personal data remains unchanged, it is information that was entered into the _________ by you, your doctor, or another person providing you with medical care or medical services and/or specified in this notice.
  
  Concluding provisions
  
  The functionality of the _________ and services through the system can be provided in full only if we first receive your consent to the processing of personal data.
  
  You can familiarize yourself with the capabilities of the _________ that are available without authorization (giving consent to the processing of personal data) in the User Agreement, which is available on the website or in the _________ mobile application.
  
  Changes and additions to this notice on the processing of personal data are made by creating a new version of them in electronic form, which are published in the _________.
  
  The date of entry into force of the new version of the notice on the processing of personal data is the date of their publication in the _________. We will definitely notify you of such changes by requesting new consent to the processing of personal data (in accordance with the terms of the new version of the notice on the processing of personal data).
  
  In case of non-acceptance (disagreement) of such a new version, we ask you to stop using the _________ and remind you that you have the right, in the manner established by law, to submit a request for the destruction of your personal data entered into the _________.
  
  `
  };

  const currentPolicyText = replacePlaceholders(policyText[i18n.language] || policyText.uk);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={getResponsiveFontSize(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('privacyPolicyHeader')}</Text>
        <View style={{ width: getResponsiveFontSize(24) }} />
      </View>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.bodyText}>
          {currentPolicyText}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: getResponsiveHeight(1.5),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: getResponsiveFontSize(5),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Mont-SemiBold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 15,
    paddingTop: getResponsiveHeight(2),
  },
  bodyText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Mont-Regular',
    color: '#555',
    lineHeight: getResponsiveFontSize(22),
    marginBottom: getResponsiveHeight(3),
  },
});

export default PrivacyPolicyScreen;