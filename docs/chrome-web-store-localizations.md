# Chrome Web Store Localizations

Use these translations for the localized Chrome Web Store listing and packaged
extension metadata. English remains the default locale. The extension now
packages every locale in Chrome's official supported-locale table: 55 locale
codes covering 49 base languages, with regional variants for English, Spanish,
Portuguese, and Chinese. Keep feature claims, privacy statements, screenshots,
and pricing consistent across every language.

The table below keeps the original launch and SEO-priority markets easy to
review. Complete copy-and-paste Store listing text for all 55 locales is in
[`chrome-web-store-listing-copy.md`](./chrome-web-store-listing-copy.md).

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

## Complete packaged coverage

`am`, `ar`, `bg`, `bn`, `ca`, `cs`, `da`, `de`, `el`, `en`, `en_AU`, `en_GB`,
`en_US`, `es`, `es_419`, `et`, `fa`, `fi`, `fil`, `fr`, `gu`, `he`, `hi`, `hr`,
`hu`, `id`, `it`, `ja`, `kn`, `ko`, `lt`, `lv`, `ml`, `mr`, `ms`, `nl`, `no`,
`pl`, `pt_BR`, `pt_PT`, `ro`, `ru`, `sk`, `sl`, `sr`, `sv`, `sw`, `ta`, `te`,
`th`, `tr`, `uk`, `vi`, `zh_CN`, `zh_TW`.

The English row is the 8 August 2026 controlled keyword experiment package. It
adds multi-device viewer, mobile preview, responsive testing, and mobile
simulator while the unchanged title protects Mobile View, device emulator, and
responsive tester. The opening description retains mobile emulator, device
simulator, and responsive design tester. The localized summaries use natural
equivalents of the established message rather than repeating English keywords.
Have a native speaker review high-traffic locales before publishing them in the
Developer Dashboard.

## Human-review priority

1. German, Spanish, Brazilian Portuguese, Japanese, Korean, Simplified Chinese,
   and Traditional Chinese — first conversion-asset and native-copy review.
2. French, Italian, Dutch, Polish, Portuguese (Portugal), Turkish, Indonesian,
   and Vietnamese — second review wave.
3. All remaining locales — publish only after checking title, summary, detailed
   description, screenshot captions, line wrapping, and right-to-left layout
   where applicable.

Chrome chooses a packaged `_locales` translation from the browser language and
falls back to English. The Store listing translations must also be entered in
the Developer Dashboard for localized discovery and conversion; packaging the
locale files alone does not publish localized Store descriptions.
