# Chrome Web Store Localizations

Use these translations for the localized Chrome Web Store listing and packaged
extension metadata. English remains the default locale. Keep feature claims,
privacy statements, screenshots, and pricing consistent across every language.

| Locale | Language / market | Extension name | Short description |
|---|---|---|---|
| `en` | English | Mobile View: Device Emulator & Responsive Tester | Multi-device viewer and mobile preview for phone, tablet and desktop—with responsive testing, mobile simulator and device emulator. |
| `de` | German | Mobile View: Responsiver Geräte-Emulator | Kostenloser Open-Source-Simulator zum Testen von Websites in Smartphone-, Tablet-, Laptop- und Desktop-Ansichten. |
| `es` | Spanish | Mobile View: Emulador móvil y prueba responsive | Simulador móvil gratuito y de código abierto para probar vistas de teléfono, tablet, portátil y escritorio en paralelo. |
| `fr` | French | Mobile View : Émulateur mobile et test responsive | Simulateur mobile gratuit et open source pour tester côte à côte les vues téléphone, tablette, ordinateur portable et bureau. |
| `zh_CN` | Simplified Chinese | Mobile View：移动设备模拟器与响应式测试 | 免费开源的移动设备模拟器和响应式测试工具，可并排预览手机、平板电脑、笔记本和桌面布局。 |
| `zh_TW` | Traditional Chinese | Mobile View：行動裝置模擬器與響應式測試 | 免費開源的行動裝置模擬器與響應式測試工具，可並排預覽手機、平板、筆電和桌面版面。 |
| `fil` | Filipino | Mobile View: Device Emulator at Responsive Tester | Libre at open-source na mobile simulator at responsive tester para sa magkatabing phone, tablet, laptop, at desktop view. |
| `nl` | Dutch | Mobile View: Apparaatemulator & responsive tester | Gratis opensource mobiele simulator en responsive tester voor telefoon-, tablet-, laptop- en desktopweergaven naast elkaar. |
| `vi` | Vietnamese | Mobile View: Trình giả lập thiết bị & kiểm thử responsive | Trình giả lập di động miễn phí, mã nguồn mở để kiểm thử song song giao diện điện thoại, máy tính bảng, laptop và máy tính. |
| `pt_BR` | Brazilian Portuguese | Mobile View: Emulador móvel e teste responsivo | Simulador móvel gratuito e de código aberto para testar lado a lado layouts de celular, tablet, notebook e desktop. |
| `it` | Italian | Mobile View: Emulatore mobile e test responsive | Simulatore mobile gratuito e open source per testare affiancate le viste telefono, tablet, laptop e desktop. |
| `ja` | Japanese | Mobile View：デバイスエミュレーター＆レスポンシブテスト | 無料・オープンソースのモバイルシミュレーター。スマホ、タブレット、ノートPC、デスクトップ表示を並べて確認できます。 |
| `ko` | Korean | Mobile View: 기기 에뮬레이터 및 반응형 테스트 | 무료 오픈 소스 모바일 시뮬레이터로 휴대폰, 태블릿, 노트북, 데스크톱 화면을 나란히 테스트하세요. |
| `hi` | Hindi | Mobile View: डिवाइस एमुलेटर और रिस्पॉन्सिव टेस्टर | फ़ोन, टैबलेट, लैपटॉप और डेस्कटॉप व्यू को साथ-साथ जाँचने के लिए मुफ़्त, ओपन-सोर्स मोबाइल सिम्युलेटर। |
| `ru` | Russian | Mobile View: эмулятор устройств и адаптивный тест | Бесплатный эмулятор и тест адаптивности: сравнивайте виды телефона, планшета, ноутбука и ПК рядом. |
| `ar` | Arabic | Mobile View: محاكي أجهزة واختبار تجاوب | محاكي جوال مجاني ومفتوح المصدر لاختبار عروض الهاتف والجهاز اللوحي والحاسوب المحمول وسطح المكتب جنبًا إلى جنب. |

The complete copy-and-paste detailed descriptions and screenshot captions are
in [`chrome-web-store-listing-copy.md`](./chrome-web-store-listing-copy.md).

The English row is the 8 August 2026 controlled keyword experiment package. It
adds multi-device viewer, mobile preview, responsive testing, and mobile
simulator while the unchanged title protects Mobile View, device emulator, and
responsive tester. The opening description retains mobile emulator, device
simulator, and responsive design tester. Measure the direct in-store ranks for 7 and 14 days before
changing localized summaries. The remaining locales retain their current
natural translations until the English experiment establishes a winning
message; then localize the same intent with human review.

## Initial rollout order

1. Spanish, French, Simplified Chinese, and Traditional Chinese — explicitly
   requested target markets.
2. Filipino, Dutch, and Vietnamese — the countries present in the Search
   Console export dated 25 July 2026.
3. Brazilian Portuguese, Italian, Japanese, Korean, and Hindi — broader
   high-reach coverage for the first international release.
4. Russian and Arabic — the strongest Store-interface signals in the May–July
   2026 page-title analytics export that were not already packaged.

Chrome chooses a packaged `_locales` translation from the browser language and
falls back to English. The Store listing translations must also be entered in
the Developer Dashboard for localized discovery and conversion; packaging the
locale files alone does not publish localized Store descriptions.
