import type { MockupAsset, MockupFrameStyle, MockupViewportConfig, Orientation } from "./device.types";

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
  viewport?: Partial<Record<Orientation, MockupViewportConfig>>;
  frameStyle?: MockupFrameStyle;
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
    },
    "frameStyle": {
      "cutoutTop": 22,
      "cutoutWidth": 116,
      "cutoutHeight": 26,
      "imageCutout": {
        "topRatio": 12.46 / 844,
        "leftRatio": 134.313 / 390,
        "widthRatio": (209.944 - 134.313) / 390,
        "heightRatio": (45.6561 - 12.46) / 844,
        "lensTopRatio": 12.46 / 844,
        "lensLeftRatio": 222.063 / 390,
        "lensSizeRatio": (255.323 - 222.063) / (45.6561 - 12.46)
      }
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
    },
    "frameStyle": {
      "cutoutTop": 22,
      "cutoutWidth": 118,
      "cutoutHeight": 26,
      "imageCutout": {
        "topRatio": 13 / 928,
        "leftRatio": 147 / 428,
        "widthRatio": 84 / 428,
        "heightRatio": 38 / 928,
        "lensTopRatio": 13.7 / 928,
        "lensLeftRatio": 243.7 / 428,
        "lensSizeRatio": 36.5 / 38
      }
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

export const mockupViewportConfigs: Record<string, Partial<Record<Orientation, MockupViewportConfig>>> = {
  "apple-watch-serie-6": {
    portrait: {
      left: 26,
      top: 96,
      width: 162,
      height: 197,
      paths: {
        portrait:
          "M0 30C0 13.4315 13.4315 0 30 0H132C148.569 0 162 13.4315 162 30V167C162 183.569 148.569 197 132 197H30C13.4315 197 0 183.569 0 167V30Z",
      },
      enableRotation: false,
    },
  },
  "apple-ipad-mini": {
    portrait: {
      left: 48,
      top: 139,
      width: 768,
      height: 1024,
      paths: {
        portrait:
          "M0 0.0999756C0 0.0447471 0.0447715 0 0.1 0H767.9C767.955 0 768 0.0447715 768 0.1V1023.9C768 1023.96 767.955 1024 767.9 1024H0.0999756C0.0447471 1024 0 1023.96 0 1023.9V0.0999756Z",
      },
      enableRotation: false,
    },
  },
  "apple-ipad-air-4": {
    portrait: {
      left: 55,
      top: 57,
      width: 820,
      height: 1180,
      paths: {
        portrait:
          "M0 17C0 7.61118 7.61116 0 17 0H803C812.389 0 820 7.61116 820 17V1163C820 1172.39 812.389 1180 803 1180H17C7.61114 1180 0 1172.39 0 1163V17Z",
      },
      enableRotation: false,
    },
  },
  "apple-ipad-pro-11-2018": {
    portrait: {
      left: 48,
      top: 50,
      width: 834,
      height: 1194,
      paths: {
        portrait:
          "M0 17C0 7.61119 7.61116 0 17 0H817C826.389 0 834 7.61116 834 17V1177C834 1186.39 826.389 1194 817 1194H17C7.61118 1194 0 1186.39 0 1177V17Z",
      },
      enableRotation: false,
    },
  },
  "samsung-galaxy-tab-s7": {
    portrait: {
      left: 46,
      top: 46,
      width: 800,
      height: 1280,
      paths: {
        portrait:
          "M0 12C0 5.37255 5.37258 0 12 0H788C794.627 0 800 5.37258 800 12V1268C800 1274.63 794.627 1280 788 1280H12C5.37257 1280 0 1274.63 0 1268V12Z",
      },
      enableRotation: false,
    },
  },
  "self-service-kiosk": {
    portrait: {
      left: 146,
      top: 150,
      width: 1080,
      height: 1920,
      paths: {
        portrait:
          "M0 1.99997C0 0.8954 0.895431 0 2 0H1078C1079.1 0 1080 0.895431 1080 2V1918C1080 1919.1 1079.1 1920 1078 1920H2.00001C0.895436 1920 0 1919.1 0 1918V1.99997Z",
      },
      enableRotation: false,
    },
  },
  "zebra-mc330": {
    portrait: {
      left: 94,
      top: 221,
      width: 480,
      height: 800,
      paths: {
        portrait: "M0 0H480V800H0V0Z",
      },
      enableRotation: false,
    },
  },
  "zebra-tc78": {
    portrait: {
      left: 49,
      top: 128,
      width: 412,
      height: 818,
      paths: {
        portrait:
          "M0 2.99999C0 1.34314 1.34315 0 3 0H409C410.657 0 412 1.34315 412 3V815C412 816.657 410.657 818 409 818H3C1.34314 818 0 816.657 0 815V2.99999Z",
      },
      enableRotation: false,
    },
  },
  "sonoff-nspanel-pro": {
    portrait: {
      left: 42,
      top: 45,
      width: 480,
      height: 480,
      paths: { portrait: "M0 0H480V480H0V0Z" },
      enableRotation: false,
    },
  },
  "apple-imac-24-inch-2021": {
    portrait: {
      left: 54,
      top: 54,
      width: 2048,
      height: 1152,
      paths: { portrait: "M0 0H2048V1152H0V0Z" },
      enableRotation: false,
    },
  },
  "apple-iphone-5": {
    portrait: {
      left: 32,
      top: 116,
      width: 320,
      height: 568,
      paths: {
        portrait: "M0 0H320V568H0V0Z",
        landscape: "M0 320L-1.39876e-05 0L568 -2.48281e-05L568 320L0 320Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-se": {
    portrait: {
      left: 26,
      top: 93,
      width: 320,
      height: 568,
      paths: {
        portrait: "M0 0H320V568H0V0Z",
        landscape: "M0 320L-1.39876e-05 0L568 -2.48281e-05L568 320L0 320Z",
      },
      enableRotation: true,
    },
  },
  "microsoft-surface-duo": {
    portrait: {
      left: 25,
      top: 91,
      width: 1114,
      height: 705,
      paths: {
        portrait: [
          "M0 0H540V705H0V0Z",
          "M574 0H1114V705H574V0Z",
        ],
      },
      enableRotation: false,
    },
  },
  "non-branded-android-smartphone": {
    portrait: {
      left: 17,
      top: 18,
      width: 360,
      height: 800,
      paths: {
        portrait:
          "M0 30C0 13.4315 13.4315 0 30 0H330C346.569 0 360 13.4315 360 30V770C360 786.569 346.569 800 330 800H30C13.4314 800 0 786.569 0 770V30Z",
        landscape:
          "M30 360C13.4315 360 1.38377e-05 346.569 1.31134e-05 330L0 30C-7.24234e-07 13.4315 13.4315 3.30707e-05 30 3.23464e-05L770 0C786.569 -7.24234e-07 800 13.4315 800 30V330C800 346.569 786.569 360 770 360L30 360Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-fold2": {
    portrait: {
      left: 17,
      top: 20,
      width: 884,
      height: 1104,
      paths: {
        portrait:
          "M0 26C0 11.6406 11.6406 0 26 0H858C872.359 0 884 11.6406 884 26V1078C884 1092.36 872.359 1104 858 1104H26C11.6406 1104 0 1092.36 0 1078V26Z",
        landscape:
          "M26 884C11.6406 884 -5.08827e-07 872.359 -1.1365e-06 858L-3.75044e-05 26C-3.8132e-05 11.6406 11.6406 -5.08827e-07 26 -1.1365e-06L1078 -4.71209e-05C1092.36 -4.77485e-05 1104 11.6405 1104 26L1104 858C1104 872.359 1092.36 884 1078 884L26 884Z",
      },
      enableRotation: true,
    },
  },
  "samsung-smart-tv": {
    portrait: {
      left: 11,
      top: 12,
      width: 1920,
      height: 1080,
      paths: {
        portrait:
          "M2.49563 2.49302C2.49818 1.39047 3.39254 0.497892 4.4951 0.497605L1915.01 0.00048835C1916.11 0.000201452 1917 0.892333 1917.01 1.99493L1919.99 1077.99C1920 1079.1 1919.1 1080 1917.99 1080H2.00491C0.898529 1080 0.00232606 1079.1 0.00488829 1078L2.49563 2.49302Z",
      },
      enableRotation: false,
    },
  },
  "macbook-air": {
    portrait: {
      left: 183,
      top: 54,
      width: 1280,
      height: 800,
      paths: { portrait: "M0 0H1280V800H0V0Z" },
      enableRotation: false,
    },
  },
  "dell-latitude-14-3420": {
    portrait: {
      left: 174,
      top: 82,
      width: 1440,
      height: 809,
      paths: { portrait: "M0 0H1440V809H0V0Z" },
      enableRotation: false,
    },
  },
  "apple-macbook-pro-16-2021": {
    portrait: {
      left: 197,
      top: 65,
      width: 1728,
      height: 1085,
      paths: { portrait: "M0 0H1728V1085H0V0Z" },
      enableRotation: false,
    },
  },
  "samsung-galaxy-s20": {
    portrait: {
      left: 11, top: 15, width: 360, height: 800,
      paths: {
        portrait:
          "M37 0C16.5655 0 0 16.5655 0 37V763C0 783.435 16.5655 800 37 800H323C343.435 800 360 783.435 360 763V37C360 16.5655 343.435 0 323 0H37ZM179.85 27.8001C185.29 27.8001 189.7 23.3901 189.7 17.9501C189.7 12.5101 185.29 8.1001 179.85 8.1001C174.41 8.1001 170 12.5101 170 17.9501C170 23.3901 174.41 27.8001 179.85 27.8001Z",
      },
    },
  },
  "xiaomi-mi-11i": {
    portrait: {
      left: 18, top: 21, width: 360, height: 800,
      paths: {
        portrait:
          "M36 0C16.1178 0 0 16.1178 0 36V764C0 783.882 16.1178 800 36 800H324C343.882 800 360 783.882 360 764V36C360 16.1178 343.882 0 324 0H36ZM179.85 25C183.467 25 186.4 22.0451 186.4 18.4C186.4 14.755 183.467 11.8 179.85 11.8C176.233 11.8 173.3 14.755 173.3 18.4C173.3 22.0451 176.233 25 179.85 25Z",
      },
    },
  },
  "huawei-p30-pro": {
    portrait: {
      left: 8, top: 14, width: 360, height: 780,
      paths: {
        portrait:
          "M27 0C12.0883 0 0 12.0883 0 27V753C0 767.912 12.0883 780 27 780H333C347.912 780 360 767.912 360 753V27C360 12.0883 347.912 0 333 0H204.3C200.434 0 197.3 3.13401 197.3 7V6.78276C197.255 16.0783 189.706 23.6 180.4 23.6C171.066 23.6 163.5 16.0336 163.5 6.7V7C163.5 3.13401 160.366 0 156.5 0H27Z",
      },
    },
  },
  "google-pixel-5": {
    portrait: {
      left: 21, top: 21, width: 393, height: 851,
      paths: {
        portrait:
          "M36 0C16.1178 0 0 16.1177 0 36V815C0 834.882 16.1177 851 36 851H357C376.882 851 393 834.882 393 815V36C393 16.1178 376.882 0 357 0H36ZM27.4004 40.8999C35.1324 40.8999 41.4004 34.6319 41.4004 26.8999C41.4004 19.1679 35.1324 12.8999 27.4004 12.8999C19.6684 12.8999 13.4004 19.1679 13.4004 26.8999C13.4004 34.6319 19.6684 40.8999 27.4004 40.8999Z",
      },
    },
  },
  "oneplus-nord-2": {
    portrait: {
      left: 20, top: 21, width: 412, height: 915,
      paths: {
        portrait:
          "M41.2755 0C18.4797 0 0 18.4797 0 41.2755V873.725C0 896.52 18.4796 915 41.2754 915H370.725C393.52 915 412 896.52 412 873.725V41.2755C412 18.4796 393.52 0 370.725 0H41.2755ZM39.75 41.5C45.9632 41.5 51 36.4632 51 30.25C51 24.0368 45.9632 19 39.75 19C33.5368 19 28.5 24.0368 28.5 30.25C28.5 36.4632 33.5368 41.5 39.75 41.5Z",
      },
    },
  },
  "apple-iphone-x": {
    portrait: {
      left: 27, top: 24, width: 375, height: 812,
      paths: {
        portrait:
          "M39.5 0C17.6848 0 0 17.6848 0 39.5V772.5C0 794.315 17.6848 812 39.5 812H335.5C357.315 812 375 794.315 375 772.5V39.5C375 17.6848 357.315 0 335.5 0H297.153C293.343 0 290.253 3.08924 290.253 6.9V0L290.253 4C290.253 17.8071 279.061 29 265.253 29H108.585C94.7778 29 83.5849 17.8071 83.5849 4V5.27273H83.57C83.3572 2.3252 80.8985 0 77.8968 0H39.5Z",
      },
    },
  },
  "apple-iphone-xr": {
    portrait: {
      left: 38, top: 36, width: 414, height: 896,
      paths: {
        portrait:
          "M41 0C18.3563 0 0 18.3563 0 41V855C0 877.644 18.3563 896 41 896H373C395.644 896 414 877.644 414 855V41C414 18.3563 395.644 0 373 0H327.34C323.529 0 320.44 3.08923 320.44 6.9V0L320.44 7C320.44 20.8071 309.247 32 295.44 32H117.278C103.471 32 92.2779 20.8071 92.2779 7V5.81818H92.2612C92.0249 2.56549 89.3112 0 85.9982 0H41Z",
      },
    },
  },
  "apple-iphone-11": {
    portrait: {
      left: 37, top: 36, width: 414, height: 896,
      paths: {
        portrait:
          "M86.0296 0H41C18.3563 0 0 18.3563 0 41V855C0 877.644 18.3563 896 41 896H373C395.644 896 414 877.644 414 855V41C414 18.3563 395.644 0 373 0H327.971C324.119 0.0157634 321 3.1437 321 6.99994V7.78607C321 21.5456 309.846 32.6999 296.086 32.6999H119C104.641 32.6999 93.0003 21.0594 93.0003 6.69995L93.0003 6.99994C93.0003 3.14371 89.8821 0.0157634 86.0296 0Z",
      },
    },
  },
  "apple-iphone-11-pro": {
    portrait: {
      left: 29, top: 25, width: 375, height: 812,
      paths: {
        portrait:
          "M39 0C17.4609 0 0 17.4609 0 39V773C0 794.539 17.4609 812 39 812H336C357.539 812 375 794.539 375 773V39C375 17.4609 357.539 0 336 0H297.841C294.343 0 291.507 2.83155 291.5 6.32735L291.5 6.34141L291.5 7.90001C291.5 20.0503 281.65 29.9 269.5 29.9H106C93.8493 29.9 83.9996 20.0503 83.9996 7.9V6.24057C83.9457 2.78481 81.1276 0 77.659 0H39Z",
      },
    },
  },
  "apple-iphone-11-pro-max": {
    portrait: {
      left: 29, top: 26, width: 414, height: 896,
      paths: {
        portrait:
          "M39 0C17.4609 0 0 17.4609 0 39V857C0 878.539 17.4609 896 39 896H375C396.539 896 414 878.539 414 857V39C414 17.4609 396.539 0 375 0H317.6C314.286 0 311.6 2.68629 311.6 6V8C311.6 20.4264 301.526 30.5 289.1 30.5H125.1C112.674 30.5 102.6 20.4264 102.6 8V5.99758C102.599 2.68498 99.9129 0 96.6 0H39Z",
      },
    },
  },
  "apple-iphone-12-mini": {
    portrait: {
      left: 23, top: 20, width: 360, height: 780,
      paths: {
        portrait:
          "M0.012382 48.8761C0.00414172 49.2498 0 49.6244 0 50V730C0 730.471 0.0065182 730.941 0.0194694 731.409C0.00408733 732.482 0.0129916 733.577 0.0476516 734.688C0.201806 739.633 0.843653 744.212 1.81724 748.003C4.78473 761.53 14.6847 772.46 27.6043 776.881C31.9306 778.566 38.1065 779.726 44.9896 779.94C46.0854 779.974 47.1648 779.983 48.2231 779.969C48.8128 779.99 49.4052 780 50 780H310C310.586 780 311.169 779.99 311.749 779.97C312.784 779.983 313.84 779.974 314.91 779.94C321.793 779.726 327.969 778.566 332.296 776.881C345.215 772.46 355.115 761.53 358.083 748.003C359.056 744.212 359.698 739.633 359.852 734.688C359.865 734.288 359.874 733.891 359.88 733.495C359.959 732.34 360 731.175 360 730V50C360 48.8273 359.96 47.664 359.88 46.5115C359.874 46.1059 359.865 45.6977 359.852 45.2873C359.698 40.3431 359.056 35.7639 358.083 31.9729C355.115 18.4459 345.215 7.51537 332.296 3.09416C327.969 1.4099 321.793 0.250069 314.91 0.0354614C313.655 -0.00368887 312.421 -0.00997896 311.215 0.0144741C310.811 0.0048429 310.406 0 310 0H295C291.686 0 289 2.68629 289 6V8C289 21.8071 277.807 33 264 33H96C82.1929 33 71 21.8071 71 8V6C71 2.68629 68.3137 0 65 0H50C49.5765 0 49.1543 0.00526451 48.7333 0.0157317C47.5086 -0.0101806 46.2541 -0.00434601 44.9774 0.0354614C38.0943 0.250069 31.9184 1.4099 27.5921 3.09416C14.6725 7.51537 4.77252 18.4459 1.80504 31.9729C0.831446 35.7639 0.189599 40.3431 0.0354446 45.2873C-0.00255409 46.506 -0.00959624 47.7044 0.012382 48.8761Z",
      },
    },
  },
  "apple-iphone-12": {
    portrait: {
      left: 24, top: 21, width: 390, height: 844,
      paths: {
        portrait:
          "M47 0C21.0426 0 0 21.0426 0 47V797C0 822.957 21.0426 844 47 844H343C368.957 844 390 822.957 390 797V47C390 21.0426 368.957 0 343 0H300V7.79471C300 20.6106 289.611 31 276.795 31H112.196C99.9376 31 89.9999 21.0623 89.9999 8.80364V4.40874C89.2819 1.86701 86.9453 0.00442505 84.1738 0.00442505H89.9999V0H47ZM300.173 0.00442505H306.226C302.883 0.00442505 300.173 2.7147 300.173 6.05798V0.00442505Z",
      },
    },
  },
  "apple-iphone-12-pro": {
    portrait: {
      left: 24, top: 21, width: 390, height: 844,
      paths: {
        portrait:
          "M47 0C21.0426 0 0 21.0426 0 47V797C0 822.957 21.0426 844 47 844H343C368.957 844 390 822.957 390 797V47C390 21.0426 368.957 0 343 0H300V7.79471C300 20.6106 289.611 31 276.795 31H112.196C99.9376 31 89.9999 21.0623 89.9999 8.80364V4.40874C89.2819 1.86701 86.9453 0.00442505 84.1738 0.00442505H89.9999V0H47ZM300.173 0.00442505H306.226C302.883 0.00442505 300.173 2.7147 300.173 6.05798V0.00442505Z",
      },
    },
  },
  "apple-iphone-12-pro-max": {
    portrait: {
      left: 25, top: 21, width: 428, height: 926,
      paths: {
        portrait:
          "M104.03 0C107.33 0.0159257 110 2.69609 110 5.99993V9.69993C110 21.8502 119.85 31.6999 132 31.6999H296C308.703 31.6999 319 21.4025 319 8.69994V5.99993C319 2.69609 321.671 0.0159257 324.971 0H375C404.271 0 428 23.7289 428 53V873C428 902.271 404.271 926 375 926H53C23.7289 926 0 902.271 0 873V53C0 23.7289 23.7289 0 53 0H104.03Z",
      },
    },
  },
  "apple-iphone-13-mini-2021": {
    portrait: {
      left: 24, top: 19, width: 375, height: 812,
      paths: {
        portrait:
          "M59.6098 0H106.259C108.653 0 110.594 1.94269 110.594 4.33935V10.3059C110.594 20.7909 119.086 29.2906 129.561 29.2906H246.981C257.456 29.2906 265.948 20.7909 265.948 10.3059V4.33935C265.948 1.94269 267.889 0 270.283 0H315.39C334.628 0 349.394 2.22715 360.098 12.4756C371.443 23.3383 375 34.986 375 59.666V655.298C375 659.808 375 660.916 375 663.656V752.649C375 777.329 371.985 788.662 360.639 799.524C349.936 809.773 335.17 812 315.932 812H60.1517C40.914 812 26.1481 809.773 15.4444 799.524C4.09924 788.662 0.000276357 776.848 0.000276357 752.168V159.042C0.000664003 156.156 0 151.363 0 148.623V59.666C0 34.986 3.55733 23.3383 14.9025 12.4756C25.6062 2.22715 40.3721 0 59.6098 0Z",
      },
    },
  },
  "apple-iphone-13-2021": {
    portrait: {
      left: 26, top: 22, width: 390, height: 844,
      paths: {
        portrait:
          "M61.9942 0H109.789C112.279 0 114.298 2.01925 114.298 4.51035V12.7121C114.298 23.6103 124.129 33.4449 135.023 33.4449H255.54C264 33.4449 275.266 24.6103 275.266 13.7121V4.51035C275.266 2.01925 277.285 0 279.775 0H328.006C348.013 0 363.868 2.34765 375 13C386.799 24.2908 390 36.3647 390 62.0174V681.122C390 685.81 390 686.962 390 689.81V782.31C390 807.963 386.864 819.742 375.065 831.033C363.933 841.685 348.577 844 328.569 844H62.5578C40.5 844 26.1319 841.652 15 831C3.20107 819.709 0.000287411 807.463 0.000287411 781.81V165.31C0.000690563 162.31 0 157.328 0 154.48V62.0174C0 36.3647 3.20107 24.2908 15 13C26.1319 2.34765 41.987 0 61.9942 0Z",
      },
    },
  },
  "apple-iphone-13-pro-2021": {
    portrait: {
      left: 23, top: 18, width: 390, height: 844,
      paths: {
        portrait:
          "M61.9942 0H117.789C120.279 0 122.298 2.01925 122.298 4.51035V10.7121C122.298 21.6103 131.129 30.4449 142.023 30.4449H248.54C259.435 30.4449 268.266 21.6103 268.266 10.7121V4.51035C268.266 2.01925 270.285 0 272.775 0H328.006C348.013 0 363.37 2.31491 374.501 12.9673C386.3 24.258 390 36.3647 390 62.0174V681.122C390 685.81 390 686.962 390 689.81V782.31C390 807.963 386.864 819.742 375.065 831.033C363.933 841.685 348.577 844 328.569 844H62.5578C42.5506 844 27.194 841.685 16.0621 831.033C4.2632 819.742 0.000287411 807.463 0.000287411 781.81V165.31C0.000690563 162.31 0 157.328 0 154.48V62.0174C0 36.3647 3.69962 24.258 15.4986 12.9673C26.6304 2.31491 41.987 0 61.9942 0Z",
      },
    },
  },
  "apple-iphone-13-pro-max-2021": {
    portrait: {
      left: 28, top: 24, width: 428, height: 926,
      paths: {
        portrait:
          "M68.0347 0H120.266C122.998 0 125.214 2.21544 125.214 4.94856V11.7528C125.214 28.7099 138.906 37.4028 149.861 37.4028H276.757C291.713 37.4028 302.405 23.7099 302.405 10.7528V4.94856C302.405 2.21544 304.62 0 307.353 0H359.965C381.922 0 398.783 2.3127 411 14C423.949 26.3877 428 39.8978 428 68.0428V747.298C428 752.441 428 753.705 428 756.829V858.316C428 886.461 424.449 899.612 411.5 912C399.283 923.687 382.54 926 360.584 926H68.6532C46.6965 926 28.2165 923.187 16 911.5C3.05142 899.112 0.000315428 885.913 0.000315428 857.768V181.371C0.000757861 178.079 0 172.613 0 169.488V68.0428C0 39.8978 3.05142 26.8877 16 14.5C28.2165 2.8127 46.078 0 68.0347 0Z",
      },
    },
  },
  "apple-iphone-14-2022": {
    portrait: {
      left: 23, top: 20, width: 390, height: 844,
      paths: {
        portrait:
          "M0 60C0 38 3.30097 24.4001 14.5 13.5C25.3088 2.97971 39.5 0 60 0H115C118.314 0 121 2.68629 121 6V11H121.052C121.822 22.1743 131.13 31 142.5 31H247.5C259.207 31 268.729 21.6432 268.994 10H269V6C269 2.68629 271.686 0 275 0H330C350.5 0 364.691 2.97971 375.5 13.5C386.699 24.4001 390 38 390 60V784C390 806 386.699 819.6 375.5 830.5C364.691 841.02 350.5 844 330 844H60C39.5 844 25.3088 841.02 14.5 830.5C3.30097 819.6 0 806 0 784V60Z",
      },
    },
  },
  "apple-iphone-14-max-2022": {
    portrait: {
      left: 26, top: 21, width: 428, height: 926,
      paths: {
        portrait:
          "M0 65.8294C0 41.6919 3.62261 26.7707 15.9128 14.8116C27.7748 3.2692 43.3487 0 65.8462 0H126.205C129.838 0 132.783 2.94728 132.783 6.58294V12.0687H132.839C133.683 24.3287 143.888 34.0118 156.352 34.0118H271.458C284.292 34.0118 294.73 23.7459 295.021 10.9716H295.028V6.58294C295.028 2.94728 297.972 0 301.605 0H362.154C384.651 0 400.225 3.2692 412.087 14.8116C424.365 26.7582 427.992 41.6608 428 65.7539V860.246C427.992 884.339 424.365 899.242 412.087 911.188C400.225 922.731 384.651 926 362.154 926H65.8462C43.3487 926 27.7748 922.731 15.9128 911.188C3.62261 899.229 0 884.308 0 860.171V65.8294Z",
      },
    },
  },
  "apple-iphone-14-pro-2022": {
    portrait: {
      left: 23, top: 21, width: 390, height: 844,
      paths: {
        portrait:
          "M16.8575 15.0065C2.83905 28.6487 0 43.2004 0 73.6681V688.478V770.332C0 800.8 2.83905 815.351 16.8575 828.994C30.158 841.937 46.9276 844 73.8084 844H178.598H211.402H316.192C343.072 844 359.842 841.937 373.143 828.994C387.161 815.351 390 800.8 390 770.332V688.478V155.521V73.6681C390 43.2004 387.161 28.6487 373.143 15.0065C359.842 2.06283 343.072 0 316.192 0H211.402H73.8084C46.9276 0 30.158 2.06283 16.8575 15.0065ZM134.313 29.058C134.313 19.8912 141.745 12.46 150.912 12.46H193.346C202.513 12.46 209.944 19.8912 209.944 29.058C209.944 38.2249 202.513 45.6561 193.346 45.6561H150.912C141.745 45.6561 134.313 38.2249 134.313 29.058ZM238.693 12.46C229.526 12.46 222.063 19.8912 222.063 29.058C222.063 38.2249 229.526 45.6561 238.693 45.6561C247.86 45.6561 255.323 38.2249 255.323 29.058C255.323 19.8912 247.86 12.46 238.693 12.46Z",
      },
    },
  },
  "apple-iphone-14-pro-max-2022": {
    portrait: {
      left: 26, top: 23, width: 428, height: 928,
      paths: {
        portrait:
          "M18.5 16.5C3.11567 31.5 0 47.5 0 81V847C0 880.5 3.11567 896.5 18.5 911.5C33.0965 925.732 51.5 928 81 928H347C376.5 928 394.904 925.732 409.5 911.5C424.884 896.5 428 880.5 428 847V81C428 47.5 424.884 31.5 409.5 16.5C394.904 2.26814 376.5 0 347 0H81C51.5 0 33.0965 2.26814 18.5 16.5ZM147.4 31.95C147.4 21.8708 155.571 13.7 165.65 13.7H212.15C222.23 13.7 230.4 21.8708 230.4 31.95C230.4 42.0292 222.23 50.2 212.15 50.2H165.65C155.571 50.2 147.4 42.0292 147.4 31.95ZM261.95 13.7C251.871 13.7 243.7 21.8708 243.7 31.95C243.7 42.0291 251.871 50.2 261.95 50.2C272.029 50.2 280.2 42.0291 280.2 31.95C280.2 21.8708 272.029 13.7 261.95 13.7Z",
      },
    },
  },
  "apple-iphone-15-2023": {
    portrait: {
      left: 21, top: 17, width: 393, height: 852,
      paths: {
        portrait:
          "M14.5 14.5C25.4948 4.00859 40.3832 0.0310924 57.3009 0.00018177L335.5 0C352.5 0 367.462 3.96745 378.5 14.5C390.237 25.6997 393 41 393 58V794C393 811 390.237 826.3 378.5 837.5C367.462 848.033 352.5 852 335.5 852H57.5C40.5 852 25.5379 848.033 14.5 837.5C2.76288 826.3 0 811 0 794V58C0 41 2.76288 25.6997 14.5 14.5ZM139.7 27.25C139.7 18.2754 146.976 11 155.95 11H193.45C202.425 11 209.7 18.2754 209.7 27.25C209.7 36.2246 202.425 43.5 193.45 43.5H155.95C146.976 43.5 139.7 36.2246 139.7 27.25ZM253.1 27.25C253.1 36.2246 245.824 43.5 236.85 43.5C227.875 43.5 220.6 36.2246 220.6 27.25C220.6 18.2754 227.875 11 236.85 11C245.824 11 253.1 18.2754 253.1 27.25Z",
      },
    },
  },
  "apple-iphone-15-plus-2023": {
    portrait: {
      left: 23, top: 18, width: 430, height: 932,
      paths: {
        portrait:
          "M17 16C1.37716 31 0 50.1548 0 70V131V801V862C0 881.845 1.37716 901 17 916C30.8162 929.265 48.45 931.244 65.6039 931.864C67.0577 931.954 68.5235 932 70 932H131H299H360C361.472 932 362.934 931.955 364.384 931.865C381.611 931.245 399.678 929.271 413.5 916C429.123 901 430 883 430 862V801V131V70C430 49 429.123 31 413.5 16C399.678 2.7292 381.611 0.754562 364.384 0.135044C362.934 0.0454568 361.472 0 360 0H299H131H70C68.5235 0 67.0577 0.0457136 65.6039 0.135803C48.4501 0.756178 30.8162 2.73463 17 16ZM170.55 12.6001C160.747 12.6001 152.8 20.547 152.8 30.3501C152.8 40.1532 160.747 48.1001 170.55 48.1001H216.89C226.693 48.1001 234.64 40.1532 234.64 30.3501C234.64 20.547 226.693 12.6001 216.89 12.6001H170.55ZM259.25 12.6001C249.447 12.6001 241.5 20.547 241.5 30.3501C241.5 40.1532 249.447 48.1001 259.25 48.1001C269.053 48.1001 277 40.1532 277 30.3501C277 20.547 269.053 12.6001 259.25 12.6001Z",
      },
    },
  },
  "apple-iphone-15-pro-2023": {
    portrait: {
      left: 20, top: 16, width: 393, height: 852,
      paths: {
        portrait:
          "M0 61.5C0 43 5.26288 27.1997 17 16C28.0379 5.46745 43.5 0 61.5 0H331.5C349.5 0 364.962 5.46745 376 16C387.737 27.1997 393 43 393 61.5V790.5C393 809 387.737 824.8 376 836C364.962 846.533 349.5 852 331.5 852H61.5C43.5 852 28.0379 846.533 17 836C5.26288 824.8 0 809 0 790.5V61.5ZM134.705 27.2727C134.57 28.1621 134.5 29.0728 134.5 30C134.5 39.2335 141.452 46.8432 150.408 47.8797C151.039 47.9472 151.679 47.9817 152.328 47.9817H192.628C193.564 47.9817 194.484 47.9096 195.382 47.7705C202.823 46.573 208.738 40.815 210.169 33.4551C210.371 32.3783 210.478 31.2674 210.478 30.1317C210.478 20.2735 202.486 12.2817 192.628 12.2817H152.328C143.442 12.2817 136.074 18.7735 134.705 27.2727ZM258.431 31.5911C257.625 40.787 249.905 48 240.5 48C230.559 48 222.5 39.9411 222.5 30C222.5 29.5597 222.516 29.1231 222.547 28.6907C223.352 19.4948 231.073 12.2817 240.478 12.2817C250.419 12.2817 258.478 20.3406 258.478 30.2817C258.478 30.722 258.462 31.1587 258.431 31.5911Z",
      },
    },
  },
  "apple-iphone-15-pro-max-2023": {
    portrait: {
      left: 19, top: 16, width: 430, height: 932,
      paths: {
        portrait:
          "M17 16C1.37716 31 0 50.1548 0 70V862C0 881.845 1.37716 901 17 916C30.8162 929.265 48.45 931.244 65.6039 931.864C67.0577 931.954 68.5235 932 70 932H360C361.472 932 362.934 931.955 364.384 931.865C381.611 931.245 399.678 929.271 413.5 916C429.123 901 430 883 430 862V70C430 49 429.123 31 413.5 16C399.678 2.7292 381.611 0.754562 364.384 0.135044C362.934 0.0454568 361.472 0 360 0H70C68.5235 0 67.0577 0.0457136 65.6039 0.135803C48.4501 0.756178 30.8162 2.73463 17 16ZM170.55 12.6001C160.747 12.6001 152.8 20.547 152.8 30.3501C152.8 40.1532 160.747 48.1001 170.55 48.1001H216.89C226.693 48.1001 234.64 40.1532 234.64 30.3501C234.64 20.547 226.693 12.6001 216.89 12.6001H170.55ZM259.25 12.6001C249.447 12.6001 241.5 20.547 241.5 30.3501C241.5 40.1532 249.447 48.1001 259.25 48.1001C269.053 48.1001 277 40.1532 277 30.3501C277 20.547 269.053 12.6001 259.25 12.6001Z",
      },
    },
  },
  "apple-iphone-16-2024": {
    portrait: {
      left: 23, top: 20, width: 393, height: 852,
      paths: {
        portrait:
          "M16 16C27.5 5.5 41 0 64.5 0H334.5C353 0 366.462 5.96745 377.5 16.5C389.237 27.6997 393 46 393 63V789C393 806 388.737 824.8 377 836C365.962 846.533 350 852 333 852H60C43 852 27.7371 847.2 16 836C4.26288 824.8 0 807 0 790V60.5C0 46 4.26288 27.1997 16 16ZM223.3 29.35C223.3 19.7679 231.068 12 240.65 12C250.232 12 258 19.7679 258 29.35C258 38.9321 250.232 46.7 240.65 46.7C231.068 46.7 223.3 38.9321 223.3 29.35ZM152.05 12C142.468 12 134.7 19.7679 134.7 29.35C134.7 38.9321 142.468 46.7 152.05 46.7H194.35C203.932 46.7 211.7 38.9321 211.7 29.35C211.7 19.7679 203.932 12 194.35 12H152.05Z",
      },
    },
  },
  "apple-iphone-16-plus-2024": {
    portrait: {
      left: 25, top: 22, width: 430, height: 932,
      paths: {
        portrait:
          "M17.5064 17.5023C30.0891 6.01643 44.8601 0 70.5725 0H365.992C386.234 0 400.964 6.52778 413.041 18.0493C425.883 30.3006 430 50.3193 430 68.9155V863.085C430 881.681 425.336 902.246 412.494 914.498C400.417 926.019 382.952 932 364.351 932H65.6489C47.0483 932 30.3485 926.749 17.5064 914.498C4.66422 902.246 0 882.775 0 864.178V66.1808C0 50.3193 4.66422 29.7537 17.5064 17.5023ZM244.324 32.1055C244.324 21.6236 252.826 13.1264 263.308 13.1264C273.789 13.1264 282.291 21.6236 282.291 32.1055C282.291 42.5873 273.789 51.0845 263.308 51.0845C252.826 51.0845 244.324 42.5873 244.324 32.1055ZM166.36 13.1264C155.878 13.1264 147.381 21.6236 147.381 32.1055C147.381 42.5873 155.878 51.0845 166.36 51.0845H212.651C223.133 51.0845 231.63 42.5873 231.63 32.1055C231.63 21.6236 223.133 13.1264 212.651 13.1264H166.36Z",
      },
    },
  },
  "apple-iphone-16-pro-max-2024": {
    portrait: {
      left: 21, top: 18, width: 440, height: 956,
      paths: {
        portrait:
          "M0.00276963 77.9995C0.00276963 25.4998 28.203 0 74.203 0H361.703C416.203 0 440.203 27.9998 440.003 81.4994V875.494C440.003 927.994 414.703 955.993 362.203 955.993H79.203C23.703 956.493 -0.296878 928.494 0.00276963 874.494V77.9995ZM248.903 34.7C248.903 23.82 257.723 15 268.603 15C279.483 15 288.303 23.82 288.303 34.7C288.303 45.58 279.483 54.4 268.603 54.4C257.723 54.4 248.903 45.58 248.903 34.7ZM171.203 15C160.323 15 151.503 23.82 151.503 34.7C151.503 45.58 160.323 54.4 171.203 54.4H216.803C227.683 54.4 236.503 45.58 236.503 34.7C236.503 23.82 227.683 15 216.803 15H171.203Z",
      },
    },
  },
  "apple-iphone-17-2025": {
    portrait: {
      left: 18, top: 15, width: 402, height: 874,
      paths: {
        portrait:
          "M328.153 0C350.085 5.26404e-05 368.797 3.60991 383.4 18.0469C398 32.4802 401.998 49.4111 402 73.833C402 73.8382 402.001 73.8434 402.001 73.8486L402.002 800.148C402.002 824.58 398.005 841.516 383.401 855.953C368.798 870.39 350.086 874 328.154 874H309.275V873.998H92.7266V874H73.8477C51.9155 874 33.2038 870.39 18.6006 855.953C3.99738 841.516 9.99415e-06 824.58 0 800.148V73.833C0.00203389 49.4112 4.00111 32.4802 18.6006 18.0469C32.7476 4.0609 50.7505 0.237046 71.8018 0.0117188L73.8486 0H328.153ZM156.478 14.8711C146.63 14.8711 138.646 22.8542 138.646 32.7021C138.646 42.5503 146.629 50.5342 156.478 50.5342H245.436C255.284 50.5341 263.267 42.5502 263.267 32.7021C263.266 22.8542 255.283 14.8712 245.436 14.8711H156.478Z",
      },
    },
  },
  "apple-iphone-air-2025": {
    portrait: {
      left: 18, top: 15, width: 420, height: 912,
      paths: {
        portrait:
          "M339.479 0C364.679 1.35325e-05 385.245 1.73931 402.045 18.5527C418.845 35.3664 420.004 55.3693 420.004 80.5898V831.409C420.004 856.63 418.845 876.633 402.045 893.446C385.297 910.207 364.808 911.987 339.716 911.998C339.637 911.998 339.557 912 339.478 912H80.5244C80.444 912 80.3636 911.998 80.2832 911.998C55.1941 911.987 34.7069 910.206 17.9609 893.446C1.26899 876.741 0.017371 856.887 0.00195312 831.896C0.00123837 831.756 4.62832e-07 831.616 0 831.476V80.5244C2.90207e-07 80.384 0.00123521 80.2437 0.00195312 80.1035C0.017371 55.1119 1.26899 35.2582 17.9609 18.5527C34.7601 1.74018 55.3244 0.000193307 80.5225 0H339.479ZM165.859 20.7559C155.941 20.7559 147.901 28.8104 147.9 38.7285C147.9 48.6468 155.941 56.7021 165.859 56.7021H254.494C264.412 56.7021 272.453 48.6468 272.453 38.7285C272.453 28.8104 264.412 20.7559 254.494 20.7559H165.859Z",
      },
    },
  },
  "apple-iphone-17-pro-2025": {
    portrait: {
      left: 19, top: 15, width: 402, height: 873,
      paths: {
        portrait:
          "M325.626 0.00195312C355.311 0.0461999 369.005 4.39275 382.819 18.0713C396.862 31.9756 402.002 47.6422 402.002 76.7354V197.398H401.999V675.602H402.002V796.265C402.002 825.358 397.14 841.302 383.098 855.206C369.272 868.895 353.087 872.963 325.527 872.998C325.441 872.998 325.355 873 325.269 873H76.7305C76.6616 873 76.5923 872.998 76.5234 872.998C48.9323 872.97 32.4858 869.182 18.6523 855.484C4.61009 841.58 6.59339e-05 825.358 0 796.265V76.7002C0.00367649 47.6289 4.61578 31.4144 18.6523 17.5156C32.4777 3.82618 48.9126 0.0337073 76.4746 0.000976562C76.5597 0.000699059 76.6453 0 76.7305 0H325.269C325.388 0 325.507 0.00141116 325.626 0.00195312ZM156.798 14.4551C146.971 14.4551 139.005 22.4226 139.005 32.249C139.005 42.0755 146.971 50.043 156.798 50.043H244.926C254.752 50.043 262.718 42.0755 262.718 32.249C262.718 22.4226 254.752 14.4551 244.926 14.4551H156.798Z",
      },
    },
  },
  "apple-iphone-17-pro-max-2025": {
    portrait: {
      left: 21, top: 17, width: 440, height: 956,
      paths: {
        portrait:
          "M356.305 0.000976562C388.867 0.0395027 403.871 4.79496 419.008 19.79C434.377 35.0162 440.004 52.1713 440.004 84.0303V216.166H440.001V739.834H440.004V871.969C440.004 903.828 434.682 921.288 419.312 936.514C404.273 951.413 386.681 955.902 356.852 955.994C356.574 955.997 356.296 956 356.018 956H83.9834C83.7553 956 83.5275 955.997 83.2998 955.995C53.3758 955.923 35.4805 951.742 20.416 936.818C5.04628 921.592 5.41729e-05 903.828 0 871.969V83.9492C0.00858399 52.1411 5.05946 34.3939 20.416 19.1807C35.5455 4.19262 53.5301 0.0383268 83.6875 0.000976562C83.7861 0.000636162 83.8847 3.40204e-07 83.9834 0H356.018C356.113 0 356.209 0.000656835 356.305 0.000976562ZM171.621 15.8311C160.866 15.8311 152.146 24.561 152.146 35.3164C152.147 46.0716 160.866 54.8018 171.621 54.8018H268.08C278.835 54.8018 287.554 46.0716 287.555 35.3164C287.555 24.561 278.836 15.8311 268.08 15.8311H171.621Z",
      },
    },
  },
  "samsung-galaxy-z-flip3-2021": {
    portrait: {
      left: 25, top: 24, width: 360, height: 880,
      paths: {
        portrait:
          "M25 0C11.1929 0 0 11.1929 0 25V855C0 868.807 11.1929 880 25 880H335C348.807 880 360 868.807 360 855V25C360 11.1929 348.807 0 335 0H25ZM180 28.5C185.799 28.5 190.5 23.799 190.5 18C190.5 12.201 185.799 7.5 180 7.5C174.201 7.5 169.5 12.201 169.5 18C169.5 23.799 174.201 28.5 180 28.5Z",
      },
    },
  },
  "oppo-find-x3-pro": {
    portrait: {
      left: 10, top: 20, width: 360, height: 804,
      paths: {
        portrait:
          "M4.36782 17.5291C0.98576 23.1849 0 30.2926 0 37.3954V766.605C0 773.61 0.243658 778.992 4.36782 786.003C10.7904 796.923 23.3579 804 36.7816 804H323.218C335.252 804 346.623 798.125 353.333 789.042C359.032 781.329 360 775.023 360 766.605V37.3953C360 28.1682 358.391 19.8663 352.184 12.8547C345.437 4.77901 334.457 0 323.218 0H36.7816C23.4539 0 10.8198 6.73938 4.36782 17.5291ZM41.0328 30.6173C46.4287 30.6173 50.8029 26.17 50.8029 20.6841C50.8029 15.1982 46.4287 10.751 41.0328 10.751C35.6369 10.751 31.2627 15.1982 31.2627 20.6841C31.2627 26.17 35.6369 30.6173 41.0328 30.6173Z",
      },
    },
  },
  "samsung-galaxy-a12-2021": {
    portrait: {
      left: 17, top: 20, width: 360, height: 800,
      paths: {
        portrait:
          "M34.8164 0C15.5878 0 0 15.5878 0 34.8164V765.184C0 784.412 15.5878 800 34.8164 800H325.184C344.412 800 360 784.412 360 765.184V34.8164C360 15.5878 344.412 0 325.184 0H221.8C213.8 0 209.3 2.30215 204.3 5.5C201.437 7.33113 199.047 9.9233 196.805 12.3537C196.024 13.2004 195.261 14.0282 194.502 14.7966C191.385 18.65 185.965 21.2 179.8 21.2C173.414 21.2 167.826 18.4632 164.771 14.3756C164.667 14.2532 164.562 14.1277 164.454 13.9996C162.489 11.6624 159.771 8.42962 156.3 6C152.3 3.2 147.008 0 138.008 0H34.8164Z",
      },
    },
  },
  "samsung-galaxy-s21-ultra": {
    portrait: {
      left: 10, top: 12, width: 360, height: 800,
      paths: {
        portrait:
          "M30 0C13.4315 0 0 13.4315 0 30V770C0 786.569 13.4314 800 30 800H330C346.569 800 360 786.569 360 770V30C360 13.4315 346.569 0 330 0H30ZM179.6 25C184.626 25 188.7 20.9258 188.7 15.9C188.7 10.8743 184.626 6.80005 179.6 6.80005C174.574 6.80005 170.5 10.8743 170.5 15.9C170.5 20.9258 174.574 25 179.6 25Z",
      },
    },
  },
  "google-pixel-6-pro": {
    portrait: {
      left: 10, top: 18, width: 360, height: 780,
      paths: {
        portrait:
          "M15 0C6.71573 0 0 6.71574 0 15V765C0 773.284 6.71574 780 15 780H345C353.284 780 360 773.284 360 765V15C360 6.71573 353.284 0 345 0H15ZM179.9 27.8999C185.423 27.8999 189.9 23.4228 189.9 17.8999C189.9 12.3771 185.423 7.8999 179.9 7.8999C174.377 7.8999 169.9 12.3771 169.9 17.8999C169.9 23.4228 174.377 27.8999 179.9 27.8999Z",
      },
    },
  },
  "xiaomi-12-2022": {
    portrait: {
      left: 11, top: 15, width: 360, height: 800,
      paths: {
        portrait:
          "M41 0C18.3563 0 0 18.3563 0 41V759C0 781.644 18.3563 800 41 800H319C341.644 800 360 781.644 360 759V41C360 18.3563 341.644 0 319 0H41ZM179.95 27.6999C185.003 27.6999 189.1 23.6033 189.1 18.5499C189.1 13.4965 185.003 9.3999 179.95 9.3999C174.896 9.3999 170.8 13.4965 170.8 18.5499C170.8 23.6033 174.896 27.6999 179.95 27.6999Z",
      },
    },
  },
  "samsung-galaxy-note20-ultra": {
    portrait: {
      left: 4, top: 11, width: 412, height: 883,
      paths: {
        portrait:
          "M13 0C5.8203 0 0 5.82029 0 13V870C0 877.18 5.82029 883 13 883H399C406.18 883 412 877.18 412 870V13C412 5.8203 406.18 0 399 0H13ZM206.1 27.4C211.126 27.4 215.2 23.3258 215.2 18.3C215.2 13.2742 211.126 9.2 206.1 9.2C201.074 9.2 197 13.2742 197 18.3C197 23.3258 201.074 27.4 206.1 27.4Z",
      },
    },
  },
  "samsung-galaxy-s22-2022": {
    portrait: {
      left: 16, top: 16, width: 360, height: 780,
      paths: {
        portrait:
          "M9.5 11.1001C2.68318 18.2734 0 25.1001 0 40V740C0 753.6 2.8883 761.879 10 769.1C17.255 776.466 28.8442 780 40 780H320C330.652 780 341.332 776.389 348.5 769.6C356.198 762.31 360 751.439 360 740V40C360 28.5607 356.198 17.3905 348.5 10.1001C341.332 3.31136 333 0 320 0H40C23.5 0 16.7877 3.43127 9.5 11.1001ZM179.6 23.9001C184.129 23.9001 187.8 20.2288 187.8 15.7001C187.8 11.1714 184.129 7.5001 179.6 7.5001C175.071 7.5001 171.4 11.1714 171.4 15.7001C171.4 20.2288 175.071 23.9001 179.6 23.9001Z",
      },
    },
  },
  "samsung-galaxy-s22-plus-2022": {
    portrait: {
      left: 16, top: 16, width: 360, height: 780,
      paths: {
        portrait:
          "M9.5 11.1001C2.68318 18.2734 0 25.1001 0 40V740C0 753.6 2.8883 761.879 10 769.1C17.255 776.466 28.8442 780 40 780H320C330.652 780 341.332 776.389 348.5 769.6C356.198 762.31 360 751.439 360 740V40C360 28.5607 356.198 17.3905 348.5 10.1001C341.332 3.31136 333 0 320 0H40C23.5 0 16.7877 3.43127 9.5 11.1001ZM179.6 23.9001C184.129 23.9001 187.8 20.2288 187.8 15.7001C187.8 11.1714 184.129 7.5001 179.6 7.5001C175.071 7.5001 171.4 11.1714 171.4 15.7001C171.4 20.2288 175.071 23.9001 179.6 23.9001Z",
      },
    },
  },
  "samsung-galaxy-s22-ultra-2022": {
    portrait: {
      left: 4, top: 5, width: 360, height: 772,
      paths: {
        portrait:
          "M7.52427 0C3.36873 0 0 3.36875 0 7.52429V764.476C0 768.631 3.36872 772 7.52426 772H352.476C356.631 772 360 768.631 360 764.476V7.52427C360 3.36873 356.631 0 352.476 0H7.52427ZM180.25 30.5C184.806 30.5 188.5 26.8063 188.5 22.25C188.5 17.6937 184.806 14 180.25 14C175.694 14 172 17.6937 172 22.25C172 26.8063 175.694 30.5 180.25 30.5Z",
      },
    },
  },
  "google-pixel-8-2024": {
    portrait: {
      left: 20, top: 20, width: 412, height: 916,
      paths: {
        portrait:
          "M36 0C16.1178 0 0 16.1178 0 36V880C0 899.882 16.1177 916 36 916H376C395.882 916 412 899.882 412 880V36C412 16.1178 395.882 0 376 0H36ZM205.55 37.2998C212.729 37.2998 218.55 31.4795 218.55 24.2998C218.55 17.1201 212.729 11.2998 205.55 11.2998C198.37 11.2998 192.55 17.1201 192.55 24.2998C192.55 31.4795 198.37 37.2998 205.55 37.2998Z",
      },
    },
  },
  "samsung-galaxy-s24-2024": {
    portrait: {
      left: 14, top: 14, width: 360, height: 780,
      paths: {
        portrait:
          "M10.5 9.5C3.41579 16.2402 0 26.4496 0 37V743C0 753.135 3.39955 762.818 10 769.5C16.7081 776.291 26.7001 780 37 780H323C334.511 780 345.214 775.744 352 767.5C357.261 761.109 360 751.924 360 743V37C360 26.6102 356.396 16.2206 349.5 9.5C342.833 3.00266 333.045 0 323 0H37C27.1158 0 17.1369 3.18536 10.5 9.5ZM180.05 27.3501C185.02 27.3501 189.05 23.3207 189.05 18.3501C189.05 13.3795 185.02 9.3501 180.05 9.3501C175.079 9.3501 171.05 13.3795 171.05 18.3501C171.05 23.3207 175.079 27.3501 180.05 27.3501Z",
      },
    },
  },
  "samsung-galaxy-s24-ultra-2024": {
    portrait: {
      left: 18, top: 15, width: 384, height: 832,
      paths: {
        portrait:
          "M2 0C0.895431 0 0 0.895438 0 2.00001V830C0 831.105 0.895423 832 1.99999 832H382C383.105 832 384 831.105 384 830V2C384 0.895431 383.105 0 382 0H2ZM191.9 26.2002C196.594 26.2002 200.4 22.3946 200.4 17.7002C200.4 13.0058 196.594 9.2002 191.9 9.2002C187.205 9.2002 183.4 13.0058 183.4 17.7002C183.4 22.3946 187.205 26.2002 191.9 26.2002Z",
      },
    },
  },
  "samsung-galaxy-s26-ultra-2026": {
    portrait: {
      left: 13, top: 12, width: 412, height: 891,
      paths: {
        portrait:
          "M382.064 0C398.597 0 412 13.4027 412 29.9355V861.064C412 877.597 398.598 891 382.065 891H29.9355C13.4027 891 0 877.597 0 861.064V29.9355C0 13.4027 13.4027 0 29.9355 0H382.064ZM206 12.2139C200.092 12.2139 195.303 17.1351 195.303 23.2061C195.303 29.277 200.092 34.1982 206 34.1982C211.908 34.1982 216.697 29.277 216.697 23.2061C216.697 17.1351 211.908 12.2139 206 12.2139Z",
      },
    },
  },
};

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
    screenInset: asset.screenInset,
    viewport: asset.viewport ?? mockupViewportConfigs[lookupId],
    frameStyle: asset.frameStyle
  }];
}
