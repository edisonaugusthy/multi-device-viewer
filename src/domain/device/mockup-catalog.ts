import type { MockupAsset } from "./device.types";

interface LocalMockupAsset {
  id: string;
  localPath: string;
  file: string;
  bytes: number;
  width: number;
  height: number;
  screenInset?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export const localMockupCatalog: LocalMockupAsset[] = [
  {
    "id": "apple-imac-24-inch-2021",
    "localPath": "/mockups/apple-imac-24-inch-2021.png",
    "file": "apple-imac-24-inch-2021.png",
    "bytes": 508235,
    "width": 4312,
    "height": 3884,
    "screenInset": {
      "top": 54,
      "right": 53,
      "bottom": 736,
      "left": 54
    }
  },
  {
    "id": "apple-ipad-air-4",
    "localPath": "/mockups/apple-ipad-air-4.png",
    "file": "apple-ipad-air-4.png",
    "bytes": 75236,
    "width": 1864,
    "height": 2584,
    "screenInset": {
      "top": 7.5,
      "right": 7.5,
      "bottom": 5.5,
      "left": 5.5
    }
  },
  {
    "id": "apple-ipad-mini",
    "localPath": "/mockups/apple-ipad-mini.png",
    "file": "apple-ipad-mini.png",
    "bytes": 69190,
    "width": 1728,
    "height": 2608,
    "screenInset": {
      "top": 9.5,
      "right": 9,
      "bottom": 9,
      "left": 9
    }
  },
  {
    "id": "apple-ipad-pro-11-2018",
    "localPath": "/mockups/apple-ipad-pro-11-2018.png",
    "file": "apple-ipad-pro-11-2018.png",
    "bytes": 81988,
    "width": 1864,
    "height": 2582,
    "screenInset": {
      "top": 8.5,
      "right": 9,
      "bottom": 6,
      "left": 6
    }
  },
  {
    "id": "apple-iphone-11-pro-max",
    "localPath": "/mockups/apple-iphone-11-pro-max.png",
    "file": "apple-iphone-11-pro-max.png",
    "bytes": 29774,
    "width": 942,
    "height": 1896,
    "screenInset": {
      "top": 18.5,
      "right": 19.5,
      "bottom": 18,
      "left": 21
    }
  },
  {
    "id": "apple-iphone-11-pro",
    "localPath": "/mockups/apple-iphone-11-pro.png",
    "file": "apple-iphone-11-pro.png",
    "bytes": 29637,
    "width": 866,
    "height": 1750,
    "screenInset": {
      "top": 17,
      "right": 21,
      "bottom": 38,
      "left": 21.5
    }
  },
  {
    "id": "apple-iphone-11",
    "localPath": "/mockups/apple-iphone-11.png",
    "file": "apple-iphone-11.png",
    "bytes": 93792,
    "width": 980,
    "height": 1936,
    "screenInset": {
      "top": 21.5,
      "right": 39,
      "bottom": 22,
      "left": 24
    }
  },
  {
    "id": "apple-iphone-12-mini",
    "localPath": "/mockups/apple-iphone-12-mini.png",
    "file": "apple-iphone-12-mini.png",
    "bytes": 42335,
    "width": 814,
    "height": 1640,
    "screenInset": {
      "top": 7.5,
      "right": 10.5,
      "bottom": 7.5,
      "left": 9.5
    }
  },
  {
    "id": "apple-iphone-12-pro-max",
    "localPath": "/mockups/apple-iphone-12-pro-max.png",
    "file": "apple-iphone-12-pro-max.png",
    "bytes": 55558,
    "width": 956,
    "height": 1936,
    "screenInset": {
      "top": 7.5,
      "right": 10.5,
      "bottom": 7.5,
      "left": 10.5
    }
  },
  {
    "id": "apple-iphone-12-pro",
    "localPath": "/mockups/apple-iphone-12-pro.png",
    "file": "apple-iphone-12-pro.png",
    "bytes": 38606,
    "width": 876,
    "height": 1772,
    "screenInset": {
      "top": 7,
      "right": 10,
      "bottom": 7,
      "left": 10
    }
  },
  {
    "id": "apple-iphone-12",
    "localPath": "/mockups/apple-iphone-12.png",
    "file": "apple-iphone-12.png",
    "bytes": 42594,
    "width": 876,
    "height": 1772,
    "screenInset": {
      "top": 7,
      "right": 10,
      "bottom": 7,
      "left": 10
    }
  },
  {
    "id": "apple-iphone-13-2021",
    "localPath": "/mockups/apple-iphone-13-2021.png",
    "file": "apple-iphone-13-2021.png",
    "bytes": 67770,
    "width": 882,
    "height": 1776,
    "screenInset": {
      "top": 8,
      "right": 11,
      "bottom": 8,
      "left": 12
    }
  },
  {
    "id": "apple-iphone-13-mini-2021",
    "localPath": "/mockups/apple-iphone-13-mini-2021.png",
    "file": "apple-iphone-13-mini-2021.png",
    "bytes": 62270,
    "width": 844,
    "height": 1702,
    "screenInset": {
      "top": 6.5,
      "right": 9.5,
      "bottom": 7,
      "left": 11
    }
  },
  {
    "id": "apple-iphone-13-pro-2021",
    "localPath": "/mockups/apple-iphone-13-pro-2021.png",
    "file": "apple-iphone-13-pro-2021.png",
    "bytes": 37214,
    "width": 868,
    "height": 1762,
    "screenInset": {
      "top": 6.5,
      "right": 8.5,
      "bottom": 6,
      "left": 10.5
    }
  },
  {
    "id": "apple-iphone-13-pro-max-2021",
    "localPath": "/mockups/apple-iphone-13-pro-max-2021.png",
    "file": "apple-iphone-13-pro-max-2021.png",
    "bytes": 40812,
    "width": 966,
    "height": 1948,
    "screenInset": {
      "top": 8.5,
      "right": 11.5,
      "bottom": 8.5,
      "left": 12
    }
  },
  {
    "id": "apple-iphone-14-2022",
    "localPath": "/mockups/apple-iphone-14-2022.png",
    "file": "apple-iphone-14-2022.png",
    "bytes": 46800,
    "width": 870,
    "height": 1772,
    "screenInset": {
      "top": 7,
      "right": 8.5,
      "bottom": 9.5,
      "left": 10.5
    }
  },
  {
    "id": "apple-iphone-14-max-2022",
    "localPath": "/mockups/apple-iphone-14-max-2022.png",
    "file": "apple-iphone-14-max-2022.png",
    "bytes": 51007,
    "width": 956,
    "height": 1936,
    "screenInset": {
      "top": 7.5,
      "right": 9.5,
      "bottom": 7.5,
      "left": 12
    }
  },
  {
    "id": "apple-iphone-14-pro-2022",
    "localPath": "/mockups/apple-iphone-14-pro-2022.png",
    "file": "apple-iphone-14-pro-2022.png",
    "bytes": 107865,
    "width": 870,
    "height": 1772,
    "screenInset": {
      "top": 8.5,
      "right": 10,
      "bottom": 8,
      "left": 10.5
    }
  },
  {
    "id": "apple-iphone-14-pro-max-2022",
    "localPath": "/mockups/apple-iphone-14-pro-max-2022.png",
    "file": "apple-iphone-14-pro-max-2022.png",
    "bytes": 42516,
    "width": 956,
    "height": 1946,
    "screenInset": {
      "top": 8.5,
      "right": 10.5,
      "bottom": 8.5,
      "left": 11.5
    }
  },
  {
    "id": "apple-iphone-15-2023",
    "localPath": "/mockups/apple-iphone-15-2023.png",
    "file": "apple-iphone-15-2023.png",
    "bytes": 119372,
    "width": 868,
    "height": 1772,
    "screenInset": {
      "top": 6,
      "right": 10,
      "bottom": 6.5,
      "left": 10.5
    }
  },
  {
    "id": "apple-iphone-15-plus-2023",
    "localPath": "/mockups/apple-iphone-15-plus-2023.png",
    "file": "apple-iphone-15-plus-2023.png",
    "bytes": 140869,
    "width": 950,
    "height": 1936,
    "screenInset": {
      "top": 6.5,
      "right": 11,
      "bottom": 6.5,
      "left": 12
    }
  },
  {
    "id": "apple-iphone-15-pro-2023",
    "localPath": "/mockups/apple-iphone-15-pro-2023.png",
    "file": "apple-iphone-15-pro-2023.png",
    "bytes": 158901,
    "width": 864,
    "height": 1768,
    "screenInset": {
      "top": 7,
      "right": 10.5,
      "bottom": 8,
      "left": 11
    }
  },
  {
    "id": "apple-iphone-15-pro-max-2023",
    "localPath": "/mockups/apple-iphone-15-pro-max-2023.png",
    "file": "apple-iphone-15-pro-max-2023.png",
    "bytes": 158193,
    "width": 938,
    "height": 1926,
    "screenInset": {
      "top": 7.5,
      "right": 11.5,
      "bottom": 7,
      "left": 11
    }
  },
  {
    "id": "apple-iphone-16-2024",
    "localPath": "/mockups/apple-iphone-16-2024.png",
    "file": "apple-iphone-16-2024.png",
    "bytes": 72289,
    "width": 878,
    "height": 1786,
    "screenInset": {
      "top": 7.5,
      "right": 11,
      "bottom": 8,
      "left": 11
    }
  },
  {
    "id": "apple-iphone-16-plus-2024",
    "localPath": "/mockups/apple-iphone-16-plus-2024.png",
    "file": "apple-iphone-16-plus-2024.png",
    "bytes": 91928,
    "width": 961,
    "height": 1954,
    "screenInset": {
      "top": 9.5,
      "right": 14.5,
      "bottom": 10,
      "left": 14
    }
  },
  {
    "id": "apple-iphone-16-pro-max-2024",
    "localPath": "/mockups/apple-iphone-16-pro-max-2024.png",
    "file": "apple-iphone-16-pro-max-2024.png",
    "bytes": 91533,
    "width": 962,
    "height": 1982,
    "screenInset": {
      "top": 10,
      "right": 13,
      "bottom": 8.5,
      "left": 13.5
    }
  },
  {
    "id": "apple-iphone-17-2025",
    "localPath": "/mockups/apple-iphone-17-2025.png",
    "file": "apple-iphone-17-2025.png",
    "bytes": 67744,
    "width": 877,
    "height": 1808,
    "screenInset": {
      "top": 8,
      "right": 11,
      "bottom": 8,
      "left": 12.5
    }
  },
  {
    "id": "apple-iphone-17-pro-2025",
    "localPath": "/mockups/apple-iphone-17-pro-2025.png",
    "file": "apple-iphone-17-pro-2025.png",
    "bytes": 61726,
    "width": 878,
    "height": 1806,
    "screenInset": {
      "top": 10.5,
      "right": 12,
      "bottom": 8.5,
      "left": 12
    }
  },
  {
    "id": "apple-iphone-17-pro-max-2025",
    "localPath": "/mockups/apple-iphone-17-pro-max-2025.png",
    "file": "apple-iphone-17-pro-max-2025.png",
    "bytes": 78432,
    "width": 963,
    "height": 1978,
    "screenInset": {
      "top": 12.5,
      "right": 13,
      "bottom": 10,
      "left": 14.5
    }
  },
  {
    "id": "apple-iphone-5",
    "localPath": "/mockups/apple-iphone-5.png",
    "file": "apple-iphone-5.png",
    "bytes": 48759,
    "width": 756,
    "height": 1600,
    "screenInset": {
      "top": 21,
      "right": 9.5,
      "bottom": 14,
      "left": 13
    }
  },
  {
    "id": "apple-iphone-air-2025",
    "localPath": "/mockups/apple-iphone-air-2025.png",
    "file": "apple-iphone-air-2025.png",
    "bytes": 41648,
    "width": 912,
    "height": 1882,
    "screenInset": {
      "top": 8,
      "right": 11,
      "bottom": 7.5,
      "left": 11.5
    }
  },
  {
    "id": "apple-iphone-se",
    "localPath": "/mockups/apple-iphone-se.png",
    "file": "apple-iphone-se.png",
    "bytes": 65099,
    "width": 744,
    "height": 1512,
    "screenInset": {
      "top": 8.5,
      "right": 17,
      "bottom": 8.5,
      "left": 17
    }
  },
  {
    "id": "apple-iphone-x",
    "localPath": "/mockups/apple-iphone-x.png",
    "file": "apple-iphone-x.png",
    "bytes": 106691,
    "width": 858,
    "height": 1720,
    "screenInset": {
      "top": 17,
      "right": 20.5,
      "bottom": 17.5,
      "left": 20.5
    }
  },
  {
    "id": "apple-iphone-xr",
    "localPath": "/mockups/apple-iphone-xr.png",
    "file": "apple-iphone-xr.png",
    "bytes": 73861,
    "width": 980,
    "height": 1936,
    "screenInset": {
      "top": 21.5,
      "right": 24.5,
      "bottom": 21.5,
      "left": 24.5
    }
  },
  {
    "id": "apple-macbook-pro-16-2021",
    "localPath": "/mockups/apple-macbook-pro-16-2021.png",
    "file": "apple-macbook-pro-16-2021.png",
    "bytes": 323138,
    "width": 4244,
    "height": 2594,
    "screenInset": {
      "top": 10.5,
      "right": 172,
      "bottom": 128.5,
      "left": 171
    }
  },
  {
    "id": "apple-watch-serie-6",
    "localPath": "/mockups/apple-watch-serie-6.png",
    "file": "apple-watch-serie-6.png",
    "bytes": 63573,
    "width": 450,
    "height": 776,
    "screenInset": {
      "top": 90.5,
      "right": 28.5,
      "bottom": 82,
      "left": 18.5
    }
  },
  {
    "id": "dell-latitude-14-3420",
    "localPath": "/mockups/dell-latitude-14-3420.png",
    "file": "dell-latitude-14-3420.png",
    "bytes": 396125,
    "width": 3574,
    "height": 2450,
    "screenInset": {
      "top": 77,
      "right": 169.5,
      "bottom": 330.5,
      "left": 169.5
    }
  },
  {
    "id": "google-pixel-5",
    "localPath": "/mockups/google-pixel-5.png",
    "file": "google-pixel-5.png",
    "bytes": 74919,
    "width": 876,
    "height": 1786,
    "screenInset": {
      "top": 12.5,
      "right": 15.5,
      "bottom": 12.5,
      "left": 12.5
    }
  },
  {
    "id": "google-pixel-6-pro",
    "localPath": "/mockups/google-pixel-6-pro.png",
    "file": "google-pixel-6-pro.png",
    "bytes": 41621,
    "width": 762,
    "height": 1656,
    "screenInset": {
      "top": 6.5,
      "right": 11,
      "bottom": 18,
      "left": 10
    }
  },
  {
    "id": "google-pixel-8-2024",
    "localPath": "/mockups/google-pixel-8-2024.png",
    "file": "google-pixel-8-2024.png",
    "bytes": 35887,
    "width": 912,
    "height": 1920,
    "screenInset": {
      "top": 11.5,
      "right": 17,
      "bottom": 10,
      "left": 13
    }
  },
  {
    "id": "huawei-p30-pro",
    "localPath": "/mockups/huawei-p30-pro.png",
    "file": "huawei-p30-pro.png",
    "bytes": 15222,
    "width": 758,
    "height": 1634,
    "screenInset": {
      "top": 5.5,
      "right": 11,
      "bottom": 5.5,
      "left": 8
    }
  },
  {
    "id": "macbook-air",
    "localPath": "/mockups/macbook-air.png",
    "file": "macbook-air.png",
    "bytes": 130937,
    "width": 3296,
    "height": 1894,
    "screenInset": {
      "top": 4,
      "right": 154,
      "bottom": 37.5,
      "left": 153
    }
  },
  {
    "id": "microsoft-surface-duo",
    "localPath": "/mockups/microsoft-surface-duo.png",
    "file": "microsoft-surface-duo.png",
    "bytes": 33398,
    "width": 2328,
    "height": 1842,
    "screenInset": {
      "top": 4.5,
      "right": 590.5,
      "bottom": 125,
      "left": 4.5
    }
  },
  {
    "id": "non-branded-android-smartphone",
    "localPath": "/mockups/non-branded-android-smartphone.png",
    "file": "non-branded-android-smartphone.png",
    "bytes": 34236,
    "width": 794,
    "height": 1672,
    "screenInset": {
      "top": 8,
      "right": 12,
      "bottom": 9,
      "left": 9.5
    }
  },
  {
    "id": "oneplus-nord-2",
    "localPath": "/mockups/oneplus-nord-2.png",
    "file": "oneplus-nord-2.png",
    "bytes": 38405,
    "width": 898,
    "height": 1944,
    "screenInset": {
      "top": 15.5,
      "right": 13,
      "bottom": 16,
      "left": 17.5
    }
  },
  {
    "id": "oppo-find-x3-pro",
    "localPath": "/mockups/oppo-find-x3-pro.png",
    "file": "oppo-find-x3-pro.png",
    "bytes": 23520,
    "width": 760,
    "height": 1690,
    "screenInset": {
      "top": 11,
      "right": 10,
      "bottom": 10,
      "left": 10
    }
  },
  {
    "id": "samsung-galaxy-a12-2021",
    "localPath": "/mockups/samsung-galaxy-a12-2021.png",
    "file": "samsung-galaxy-a12-2021.png",
    "bytes": 43247,
    "width": 794,
    "height": 1718,
    "screenInset": {
      "top": 8,
      "right": 12,
      "bottom": 8,
      "left": 8.5
    }
  },
  {
    "id": "samsung-galaxy-fold2",
    "localPath": "/mockups/samsung-galaxy-fold2.png",
    "file": "samsung-galaxy-fold2.png",
    "bytes": 71206,
    "width": 1842,
    "height": 2284,
    "screenInset": {
      "top": 21,
      "right": 20,
      "bottom": 9,
      "left": 17
    }
  },
  {
    "id": "samsung-galaxy-note20-ultra",
    "localPath": "/mockups/samsung-galaxy-note20-ultra.png",
    "file": "samsung-galaxy-note20-ultra.png",
    "bytes": 19489,
    "width": 846,
    "height": 1826,
    "screenInset": {
      "top": 7.5,
      "right": 7,
      "bottom": 8.5,
      "left": 3.5
    }
  },
  {
    "id": "samsung-galaxy-s20",
    "localPath": "/mockups/samsung-galaxy-s20.png",
    "file": "samsung-galaxy-s20.png",
    "bytes": 32958,
    "width": 768,
    "height": 1668,
    "screenInset": {
      "top": 7.5,
      "right": 21,
      "bottom": 8.5,
      "left": 19
    }
  },
  {
    "id": "samsung-galaxy-s21-ultra",
    "localPath": "/mockups/samsung-galaxy-s21-ultra.png",
    "file": "samsung-galaxy-s21-ultra.png",
    "bytes": 53607,
    "width": 764,
    "height": 1658,
    "screenInset": {
      "top": 9.5,
      "right": 12,
      "bottom": 8.5,
      "left": 10
    }
  },
  {
    "id": "samsung-galaxy-s22-2022",
    "localPath": "/mockups/samsung-galaxy-s22-2022.png",
    "file": "samsung-galaxy-s22-2022.png",
    "bytes": 43105,
    "width": 786,
    "height": 1622,
    "screenInset": {
      "top": 15,
      "right": 13.5,
      "bottom": 10,
      "left": 9.5
    }
  },
  {
    "id": "samsung-galaxy-s22-plus-2022",
    "localPath": "/mockups/samsung-galaxy-s22-plus-2022.png",
    "file": "samsung-galaxy-s22-plus-2022.png",
    "bytes": 28015,
    "width": 786,
    "height": 1622,
    "screenInset": {
      "top": 10,
      "right": 13,
      "bottom": 10,
      "left": 9
    }
  },
  {
    "id": "samsung-galaxy-s22-ultra-2022",
    "localPath": "/mockups/samsung-galaxy-s22-ultra-2022.png",
    "file": "samsung-galaxy-s22-ultra-2022.png",
    "bytes": 11713,
    "width": 742,
    "height": 1568,
    "screenInset": {
      "top": 5,
      "right": 4,
      "bottom": 1.5,
      "left": 4
    }
  },
  {
    "id": "samsung-galaxy-s24-2024",
    "localPath": "/mockups/samsung-galaxy-s24-2024.png",
    "file": "samsung-galaxy-s24-2024.png",
    "bytes": 39680,
    "width": 780,
    "height": 1614,
    "screenInset": {
      "top": 6,
      "right": 8,
      "bottom": 5.5,
      "left": 14
    }
  },
  {
    "id": "samsung-galaxy-s24-ultra-2024",
    "localPath": "/mockups/samsung-galaxy-s24-ultra-2024.png",
    "file": "samsung-galaxy-s24-ultra-2024.png",
    "bytes": 83376,
    "width": 844,
    "height": 1728,
    "screenInset": {
      "top": 7,
      "right": 15,
      "bottom": 9.5,
      "left": 12.5
    }
  },
  {
    "id": "samsung-galaxy-s26-ultra-2026",
    "localPath": "/mockups/samsung-galaxy-s26-ultra-2026.png",
    "file": "samsung-galaxy-s26-ultra-2026.png",
    "bytes": 27833,
    "width": 882,
    "height": 1832,
    "screenInset": {
      "top": 5.5,
      "right": 9.5,
      "bottom": 6.5,
      "left": 6.5
    }
  },
  {
    "id": "samsung-galaxy-tab-s7",
    "localPath": "/mockups/samsung-galaxy-tab-s7.png",
    "file": "samsung-galaxy-tab-s7.png",
    "bytes": 80268,
    "width": 1790,
    "height": 2744,
    "screenInset": {
      "top": 5.5,
      "right": 8.5,
      "bottom": 6,
      "left": 5.5
    }
  },
  {
    "id": "samsung-galaxy-z-flip3-2021",
    "localPath": "/mockups/samsung-galaxy-z-flip3-2021.png",
    "file": "samsung-galaxy-z-flip3-2021.png",
    "bytes": 82462,
    "width": 828,
    "height": 1858,
    "screenInset": {
      "top": 9,
      "right": 16.5,
      "bottom": 8.5,
      "left": 12
    }
  },
  {
    "id": "samsung-smart-tv",
    "localPath": "/mockups/samsung-smart-tv.png",
    "file": "samsung-smart-tv.png",
    "bytes": 114935,
    "width": 3882,
    "height": 2418,
    "screenInset": {
      "top": 5,
      "right": 7,
      "bottom": 116.5,
      "left": 6
    }
  },
  {
    "id": "self-service-kiosk",
    "localPath": "/mockups/self-service-kiosk.png",
    "file": "self-service-kiosk.png",
    "bytes": 921669,
    "width": 2752,
    "height": 6036,
    "screenInset": {
      "top": 88,
      "right": 93,
      "bottom": 871,
      "left": 101
    }
  },
  {
    "id": "sonoff-nspanel-pro",
    "localPath": "/mockups/sonoff-nspanel-pro.png",
    "file": "sonoff-nspanel-pro.png",
    "bytes": 46336,
    "width": 1132,
    "height": 1136,
    "screenInset": {
      "top": 7,
      "right": 6.5,
      "bottom": 7,
      "left": 5
    }
  },
  {
    "id": "xiaomi-12-2022",
    "localPath": "/mockups/xiaomi-12-2022.png",
    "file": "xiaomi-12-2022.png",
    "bytes": 39658,
    "width": 770,
    "height": 1670,
    "screenInset": {
      "top": 10.5,
      "right": 14,
      "bottom": 11.5,
      "left": 11
    }
  },
  {
    "id": "xiaomi-mi-11i",
    "localPath": "/mockups/xiaomi-mi-11i.png",
    "file": "xiaomi-mi-11i.png",
    "bytes": 25403,
    "width": 792,
    "height": 1684,
    "screenInset": {
      "top": 12.5,
      "right": 16,
      "bottom": 13.5,
      "left": 12
    }
  },
  {
    "id": "zebra-mc330",
    "localPath": "/mockups/zebra-mc330.png",
    "file": "zebra-mc330.png",
    "bytes": 479600,
    "width": 1362,
    "height": 3716,
    "screenInset": {
      "top": 221,
      "right": 107,
      "bottom": 837,
      "left": 94
    }
  },
  {
    "id": "zebra-tc78",
    "localPath": "/mockups/zebra-tc78.png",
    "file": "zebra-tc78.png",
    "bytes": 193087,
    "width": 1020,
    "height": 2112,
    "screenInset": {
      "top": 128,
      "right": 49,
      "bottom": 110,
      "left": 49
    }
  }
];

const aliases: Record<string, string> = {
  "apple-iphone-14": "apple-iphone-14-2022",
  "apple-iphone-15": "apple-iphone-15-2023",
  "apple-iphone-13-mini": "apple-iphone-13-mini-2021",
  "apple-iphone-se-2018": "apple-iphone-se",
  "samsung-galaxy-s24": "samsung-galaxy-s24-2024",
  "samsung-galaxy-s24-ultra": "samsung-galaxy-s24-ultra-2024",
  "google-pixel-8": "google-pixel-8-2024",
  "samsung-galaxy-z-fold-2": "samsung-galaxy-fold2",
  "apple-ipad-mini-6": "apple-ipad-mini",
  "macbook-pro-16-2021": "apple-macbook-pro-16-2021",
  "macbook-air-2020-13": "macbook-air",
  "imac-24-2021": "apple-imac-24-inch-2021",
  "apple-watch-series-6-40": "apple-watch-serie-6",
  "samsung-neo-qled-4k-55": "samsung-smart-tv"
};

export function getMockupAssets(deviceId: string): MockupAsset[] {
  const lookupId = aliases[deviceId] ?? deviceId;
  const asset = localMockupCatalog.find((candidate) => candidate.id === lookupId);
  if (!asset) return [];
  return [{
    kind: "transparent-png",
    localPath: asset.localPath,
    width: asset.width,
    height: asset.height,
    screenInset: asset.screenInset
  }];
}
