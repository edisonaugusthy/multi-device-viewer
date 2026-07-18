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
  },
  {
    "id": "google-pixel-10-2026",
    "localPath": "/mockups/google-pixel-10-2026.png",
    "file": "google-pixel-10-2026.png",
    "bytes": 18649,
    "width": 918,
    "height": 1938
  },
  {
    "id": "google-pixel-10-pro-2026",
    "localPath": "/mockups/google-pixel-10-pro-2026.png",
    "file": "google-pixel-10-pro-2026.png",
    "bytes": 19738,
    "width": 900,
    "height": 1894
  },
  {
    "id": "google-pixel-10-pro-fold-2026",
    "localPath": "/mockups/google-pixel-10-pro-fold-2026.png",
    "file": "google-pixel-10-pro-fold-2026.png",
    "bytes": 38849,
    "width": 940,
    "height": 1902
  },
  {
    "id": "samsung-galaxy-a17-2025",
    "localPath": "/mockups/samsung-galaxy-a17-2025.png",
    "file": "samsung-galaxy-a17-2025.png",
    "bytes": 26123,
    "width": 918,
    "height": 1912
  },
  {
    "id": "motorola-razr-70-ultra-2026",
    "localPath": "/mockups/motorola-razr-70-ultra-2026.png",
    "file": "motorola-razr-70-ultra-2026.png",
    "bytes": 46907,
    "width": 936,
    "height": 2130
  },
  {
    "id": "infinix-hot-70-2026",
    "localPath": "/mockups/infinix-hot-70-2026.png",
    "file": "infinix-hot-70-2026.png",
    "bytes": 26666,
    "width": 796,
    "height": 1680
  }
];

export const mockupViewportConfigs: Record<string, Partial<Record<Orientation, MockupViewportConfig>>> = {
  "apple-watch-serie-6": {
    portrait: {
      left: 26, top: 96, width: 162, height: 197,
      paths: {
        portrait: "M0 30C0 13.4315 13.4315 0 30 0H132C148.569 0 162 13.4315 162 30V167C162 183.569 148.569 197 132 197H30C13.4315 197 0 183.569 0 167V30Z",
      },
      enableRotation: false,
    },
  },
  "samsung-galaxy-s20": {
    portrait: {
      left: 11, top: 15, width: 360, height: 800,
      paths: {
        portrait: "M37 0C16.5655 0 0 16.5655 0 37V763C0 783.435 16.5655 800 37 800H323C343.435 800 360 783.435 360 763V37C360 16.5655 343.435 0 323 0H37ZM179.85 27.8001C185.29 27.8001 189.7 23.3901 189.7 17.9501C189.7 12.5101 185.29 8.1001 179.85 8.1001C174.41 8.1001 170 12.5101 170 17.9501C170 23.3901 174.41 27.8001 179.85 27.8001Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 15, top: 11, width: 800, height: 360,
      paths: {
        landscape: "M-1.61732e-06 323C-7.241e-07 343.435 16.5655 360 37 360L763 360C783.435 360 800 343.434 800 323L800 37C800 16.5654 783.435 -3.4245e-05 763 -3.33518e-05L37 -1.61732e-06C16.5655 -7.24099e-07 -1.5012e-05 16.5655 -1.41188e-05 37L-1.61732e-06 323ZM27.8001 180.15C27.8001 174.71 23.3901 170.3 17.9501 170.3C12.5101 170.3 8.10009 174.71 8.10009 180.15C8.10009 185.59 12.5101 190 17.9501 190C23.3901 190 27.8001 185.59 27.8001 180.15Z",
      },
      enableRotation: true,
    },
  },
  "xiaomi-mi-11i": {
    portrait: {
      left: 18, top: 21, width: 360, height: 800,
      paths: {
        portrait: "M36 0C16.1178 0 0 16.1178 0 36V764C0 783.882 16.1178 800 36 800H324C343.882 800 360 783.882 360 764V36C360 16.1178 343.882 0 324 0H36ZM179.85 25C183.467 25 186.4 22.0451 186.4 18.4C186.4 14.755 183.467 11.8 179.85 11.8C176.233 11.8 173.3 14.755 173.3 18.4C173.3 22.0451 176.233 25 179.85 25Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 21, top: 18, width: 800, height: 360,
      paths: {
        landscape: "M-1.57361e-06 324C-7.04529e-07 343.882 16.1178 360 36 360L764 360C783.882 360 800 343.882 800 324L800 36C800 16.1177 783.882 -3.42646e-05 764 -3.33955e-05L36 -1.57361e-06C16.1177 -7.04529e-07 -1.50316e-05 16.1178 -1.41625e-05 36L-1.57361e-06 324ZM25 180.15C25 176.533 22.0451 173.6 18.4 173.6C14.755 173.6 11.8 176.533 11.8 180.15C11.8 183.767 14.755 186.7 18.4 186.7C22.0451 186.7 25 183.767 25 180.15Z",
      },
      enableRotation: true,
    },
  },
  "huawei-p30-pro": {
    portrait: {
      left: 8, top: 14, width: 360, height: 780,
      paths: {
        portrait: "M27 0C12.0883 0 0 12.0883 0 27V753C0 767.912 12.0883 780 27 780H333C347.912 780 360 767.912 360 753V27C360 12.0883 347.912 0 333 0H204.3C200.434 0 197.3 3.13401 197.3 7V6.78276C197.255 16.0783 189.706 23.6 180.4 23.6C171.066 23.6 163.5 16.0336 163.5 6.7V7C163.5 3.13401 160.366 0 156.5 0H27Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 14, top: 8, width: 780, height: 360,
      paths: {
        landscape: "M-1.18021e-06 333C-5.28397e-07 347.912 12.0883 360 27 360L753 360C767.912 360 780 347.912 780 333L780 27C780 12.0883 767.912 -3.35665e-05 753 -3.29147e-05L27 -1.18021e-06C12.0883 -5.28397e-07 -1.52077e-05 12.0883 -1.45559e-05 27L-8.93023e-06 155.7C-8.76124e-06 159.566 3.134 162.7 6.99999 162.7L6.78275 162.7C16.0783 162.745 23.6 170.294 23.6 179.6C23.6 188.934 16.0336 196.5 6.7 196.5L6.99999 196.5C3.134 196.5 -7.00982e-06 199.634 -6.84083e-06 203.5L-1.18021e-06 333Z",
      },
      enableRotation: true,
    },
  },
  "google-pixel-5": {
    portrait: {
      left: 21, top: 21, width: 393, height: 851,
      paths: {
        portrait: "M36 0C16.1178 0 0 16.1177 0 36V815C0 834.882 16.1177 851 36 851H357C376.882 851 393 834.882 393 815V36C393 16.1178 376.882 0 357 0H36ZM27.4004 40.8999C35.1324 40.8999 41.4004 34.6319 41.4004 26.8999C41.4004 19.1679 35.1324 12.8999 27.4004 12.8999C19.6684 12.8999 13.4004 19.1679 13.4004 26.8999C13.4004 34.6319 19.6684 40.8999 27.4004 40.8999Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 21, top: 21, width: 851, height: 393,
      paths: {
        landscape: "M-1.57361e-06 357C-7.04529e-07 376.882 16.1177 393 36 393L815 393C834.882 393 851 376.882 851 357L851 36C851 16.1177 834.882 -3.64939e-05 815 -3.56248e-05L36 -1.57361e-06C16.1177 -7.04529e-07 -1.6474e-05 16.1177 -1.5605e-05 36L-1.57361e-06 357ZM40.8999 365.6C40.8999 357.868 34.6319 351.6 26.8999 351.6C19.1679 351.6 12.8999 357.868 12.8999 365.6C12.8999 373.332 19.1679 379.6 26.8999 379.6C34.6319 379.6 40.8999 373.332 40.8999 365.6Z",
      },
      enableRotation: true,
    },
  },
  "oneplus-nord-2": {
    portrait: {
      left: 20, top: 21, width: 412, height: 915,
      paths: {
        portrait: "M41.2755 0C18.4797 0 0 18.4797 0 41.2755V873.725C0 896.52 18.4796 915 41.2754 915H370.725C393.52 915 412 896.52 412 873.725V41.2755C412 18.4796 393.52 0 370.725 0H41.2755ZM39.75 41.5C45.9632 41.5 51 36.4632 51 30.25C51 24.0368 45.9632 19 39.75 19C33.5368 19 28.5 24.0368 28.5 30.25C28.5 36.4632 33.5368 41.5 39.75 41.5Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 21, top: 20, width: 915, height: 412,
      paths: {
        landscape: "M0.499998 371.225C0.499999 394.02 18.9797 412.5 41.7755 412.5L874.225 412.5C897.02 412.5 915.5 394.02 915.5 371.225L915.5 41.7754C915.5 18.9796 897.02 0.499961 874.225 0.499962L41.7754 0.499998C18.9796 0.499999 0.499983 18.9796 0.499984 41.7755L0.499998 371.225ZM42 372.75C42 366.537 36.9632 361.5 30.75 361.5C24.5368 361.5 19.5 366.537 19.5 372.75C19.5 378.963 24.5368 384 30.75 384C36.9632 384 42 378.963 42 372.75Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-fold2": {
    portrait: {
      left: 17, top: 20, width: 884, height: 1104,
      paths: {
        portrait: "M0 26C0 11.6406 11.6406 0 26 0H858C872.359 0 884 11.6406 884 26V1078C884 1092.36 872.359 1104 858 1104H26C11.6406 1104 0 1092.36 0 1078V26Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 20, top: 17, width: 1104, height: 884,
      paths: {
        landscape: "M26 884C11.6406 884 -5.08827e-07 872.359 -1.1365e-06 858L-3.75044e-05 26C-3.8132e-05 11.6406 11.6406 -5.08827e-07 26 -1.1365e-06L1078 -4.71209e-05C1092.36 -4.77485e-05 1104 11.6405 1104 26L1104 858C1104 872.359 1092.36 884 1078 884L26 884Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-5": {
    portrait: {
      left: 32, top: 116, width: 320, height: 568,
      paths: {
        portrait: "M0 0H320V568H0V0Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 116, top: 32, width: 568, height: 320,
      paths: {
        landscape: "M0 320L-1.39876e-05 0L568 -2.48281e-05L568 320L0 320Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-se": {
    portrait: {
      left: 26, top: 93, width: 320, height: 568,
      paths: {
        portrait: "M0 0H320V568H0V0Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 93, top: 26, width: 568, height: 320,
      paths: {
        landscape: "M0 320L-1.39876e-05 0L568 -2.48281e-05L568 320L0 320Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-x": {
    portrait: {
      left: 27, top: 24, width: 375, height: 812,
      paths: {
        portrait: "M39.5 0C17.6848 0 0 17.6848 0 39.5V772.5C0 794.315 17.6848 812 39.5 812H335.5C357.315 812 375 794.315 375 772.5V39.5C375 17.6848 357.315 0 335.5 0H297.153C293.343 0 290.253 3.08924 290.253 6.9V0L290.253 4C290.253 17.8071 279.061 29 265.253 29H108.585C94.7778 29 83.5849 17.8071 83.5849 4V5.27273H83.57C83.3572 2.3252 80.8985 0 77.8968 0H39.5Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 24, top: 27, width: 812, height: 375,
      paths: {
        landscape: "M0.5 336C0.5 357.815 18.1848 375.5 40 375.5L773 375.5C794.815 375.5 812.5 357.815 812.5 336L812.5 40C812.5 18.1848 794.815 0.500009 773 0.500009L40 0.5C18.1848 0.5 0.500004 18.1848 0.500004 40L0.500004 78.3465C0.500003 82.1573 3.58924 85.2465 7.40001 85.2465L0.500003 85.2465L4.50001 85.2466C18.3071 85.2466 29.5 96.4395 29.5 110.247L29.5 266.915C29.5 280.722 18.3071 291.915 4.5 291.915L5.77273 291.915L5.77273 291.93C2.8252 292.143 0.500001 294.601 0.500001 297.603L0.5 336Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-xr": {
    portrait: {
      left: 38, top: 36, width: 414, height: 896,
      paths: {
        portrait: "M41 0C18.3563 0 0 18.3563 0 41V855C0 877.644 18.3563 896 41 896H373C395.644 896 414 877.644 414 855V41C414 18.3563 395.644 0 373 0H327.34C323.529 0 320.44 3.08923 320.44 6.9V0L320.44 7C320.44 20.8071 309.247 32 295.44 32H117.278C103.471 32 92.2779 20.8071 92.2779 7V5.81818H92.2612C92.0249 2.56549 89.3112 0 85.9982 0H41Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 36, top: 38, width: 896, height: 414,
      paths: {
        landscape: "M-1.79217e-06 373C-8.02381e-07 395.644 18.3563 414 41 414L855 414C877.644 414 896 395.644 896 373L896 41C896 18.3563 877.644 2.26721e-05 855 2.36619e-05L41 5.9243e-05C18.3563 6.02328e-05 -1.72941e-05 18.3564 -1.63043e-05 41.0001L-1.43085e-05 86.66C-1.41419e-05 90.4708 3.08922 93.56 6.89998 93.56L-1.40069e-05 93.56L6.99999 93.5601C20.8071 93.5601 32 104.753 32 118.56L32 296.722C32 310.529 20.8071 321.722 7 321.722L5.81818 321.722L5.81818 321.739C2.56549 321.975 -3.90392e-06 324.689 -3.7591e-06 328.002L-1.79217e-06 373Z",
      },
      enableRotation: true,
    },
  },
  "apple-ipad-mini": {
    portrait: {
      left: 48, top: 139, width: 768, height: 1024,
      paths: {
        portrait: "M0 0.0999756C0 0.0447471 0.0447715 0 0.1 0H767.9C767.955 0 768 0.0447715 768 0.1V1023.9C768 1023.96 767.955 1024 767.9 1024H0.0999756C0.0447471 1024 0 1023.96 0 1023.9V0.0999756Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 139, top: 48, width: 1024, height: 768,
      paths: {
        landscape: "M0.0999756 768C0.0447471 768 -1.95703e-09 767.955 -4.37114e-09 767.9L-3.3566e-05 0.0999756C-3.35684e-05 0.0447471 0.044738 -1.95701e-09 0.0999664 -4.37115e-09L1023.9 -4.47561e-05C1023.96 -4.47585e-05 1024 0.0447023 1024 0.0999308L1024 767.9C1024 767.955 1023.96 768 1023.9 768L0.0999756 768Z",
      },
      enableRotation: true,
    },
  },
  "apple-ipad-air-4": {
    portrait: {
      left: 55, top: 57, width: 820, height: 1180,
      paths: {
        portrait: "M0 17C0 7.61118 7.61116 0 17 0H803C812.389 0 820 7.61116 820 17V1163C820 1172.39 812.389 1180 803 1180H17C7.61114 1180 0 1172.39 0 1163V17Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 57, top: 55, width: 1180, height: 820,
      paths: {
        landscape: "M17 820C7.61118 820 -3.32694e-07 812.389 -7.43094e-07 803L-3.51002e-05 17C-3.55106e-05 7.61116 7.61112 -3.32694e-07 17 -7.43094e-07L1163 -5.08363e-05C1172.39 -5.12467e-05 1180 7.61111 1180 16.9999L1180 803C1180 812.389 1172.39 820 1163 820L17 820Z",
      },
      enableRotation: true,
    },
  },
  "apple-ipad-pro-11-2018": {
    portrait: {
      left: 48, top: 50, width: 834, height: 1194,
      paths: {
        portrait: "M0 17C0 7.61119 7.61116 0 17 0H817C826.389 0 834 7.61116 834 17V1177C834 1186.39 826.389 1194 817 1194H17C7.61118 1194 0 1186.39 0 1177V17Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 50, top: 48, width: 1194, height: 834,
      paths: {
        landscape: "M17 834C7.61119 834 -3.32694e-07 826.389 -7.43094e-07 817L-3.57122e-05 17C-3.61226e-05 7.61116 7.61112 -3.32694e-07 17 -7.43094e-07L1177 -5.14483e-05C1186.39 -5.18587e-05 1194 7.61111 1194 16.9999L1194 817C1194 826.389 1186.39 834 1177 834L17 834Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-tab-s7": {
    portrait: {
      left: 46, top: 46, width: 800, height: 1280,
      paths: {
        portrait: "M0 12C0 5.37255 5.37258 0 12 0H788C794.627 0 800 5.37258 800 12V1268C800 1274.63 794.627 1280 788 1280H12C5.37257 1280 0 1274.63 0 1268V12Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 46, top: 46, width: 1280, height: 800,
      paths: {
        landscape: "M12 800C5.37255 800 -2.34843e-07 794.627 -5.24537e-07 788L-3.44446e-05 12C-3.47343e-05 5.37258 5.37255 -2.34843e-07 12 -5.24537e-07L1268 -5.5426e-05C1274.63 -5.57157e-05 1280 5.37253 1280 11.9999L1280 788C1280 794.627 1274.63 800 1268 800L12 800Z",
      },
      enableRotation: true,
    },
  },
  "macbook-air": {
    portrait: {
      left: 183, top: 54, width: 1280, height: 800,
      paths: {
        portrait: "M0 0H1280V800H0V0Z",
      },
      enableRotation: false,
    },
  },
  "dell-latitude-14-3420": {
    portrait: {
      left: 174, top: 82, width: 1440, height: 809,
      paths: {
        portrait: "M0 0H1440V809H0V0Z",
      },
      enableRotation: false,
    },
  },
  "apple-iphone-11": {
    portrait: {
      left: 37, top: 36, width: 414, height: 896,
      paths: {
        portrait: "M86.0296 0H41C18.3563 0 0 18.3563 0 41V855C0 877.644 18.3563 896 41 896H373C395.644 896 414 877.644 414 855V41C414 18.3563 395.644 0 373 0H327.971C324.119 0.0157634 321 3.1437 321 6.99994V7.78607C321 21.5456 309.846 32.6999 296.086 32.6999H119C104.641 32.6999 93.0003 21.0594 93.0003 6.69995L93.0003 6.99994C93.0003 3.14371 89.8821 0.0157634 86.0296 0Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 36, top: 37, width: 896, height: 414,
      paths: {
        landscape: "M-3.76047e-06 327.97L-1.79217e-06 373C-8.02381e-07 395.644 18.3563 414 41 414L855 414C877.644 414 896 395.644 896 373L896 41C896 18.3563 877.644 -3.8363e-05 855 -3.73732e-05L41 -1.79217e-06C18.3563 -8.02381e-07 -1.72941e-05 18.3563 -1.63043e-05 41L-1.43361e-05 86.0289C0.0157492 89.8815 3.14369 92.9997 6.99993 92.9997L7.78605 92.9997C21.5456 92.9997 32.6999 104.154 32.6999 117.914L32.6999 295C32.6999 309.359 21.0593 321 6.69994 321L6.99994 321C3.1437 321 0.0157594 324.118 -3.76047e-06 327.97Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-11-pro": {
    portrait: {
      left: 29, top: 25, width: 375, height: 812,
      paths: {
        portrait: "M39 0C17.4609 0 0 17.4609 0 39V773C0 794.539 17.4609 812 39 812H336C357.539 812 375 794.539 375 773V39C375 17.4609 357.539 0 336 0H297.841C294.343 0 291.507 2.83155 291.5 6.32735L291.5 6.34141L291.5 7.90001C291.5 20.0503 281.65 29.9 269.5 29.9H106C93.8493 29.9 83.9996 20.0503 83.9996 7.9V6.24057C83.9457 2.78481 81.1276 0 77.659 0H39Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 25, top: 29, width: 812, height: 375,
      paths: {
        landscape: "M0.499998 336.5C0.499999 358.039 17.9609 375.5 39.5 375.5L773.5 375.5C795.039 375.5 812.5 358.039 812.5 336.5L812.5 39.5C812.5 17.9609 795.039 0.499965 773.5 0.499966L39.5 0.499998C17.9609 0.499999 0.499984 17.9609 0.499985 39.5L0.499987 77.659C0.499987 81.1566 3.33154 83.9928 6.82733 84.0004L6.8414 84.0004L8.4 84.0004C20.5503 84.0004 30.4 93.8501 30.4 106L30.4 269.5C30.4 281.651 20.5503 291.5 8.4 291.5L6.74057 291.5C3.28481 291.554 0.499996 294.372 0.499997 297.841L0.499998 336.5Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-11-pro-max": {
    portrait: {
      left: 29, top: 26, width: 414, height: 896,
      paths: {
        portrait: "M39 0C17.4609 0 0 17.4609 0 39V857C0 878.539 17.4609 896 39 896H375C396.539 896 414 878.539 414 857V39C414 17.4609 396.539 0 375 0H317.6C314.286 0 311.6 2.68629 311.6 6V8C311.6 20.4264 301.526 30.5 289.1 30.5H125.1C112.674 30.5 102.6 20.4264 102.6 8V5.99758C102.599 2.68498 99.9129 0 96.6 0H39Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 26, top: 29, width: 896, height: 414,
      paths: {
        landscape: "M-1.70474e-06 375C-7.6324e-07 396.539 17.4609 414 39 414L857 414C878.539 414 896 396.539 896 375L896 39C896 17.4609 878.539 -3.84022e-05 857 -3.74607e-05L39 -1.70474e-06C17.4609 -7.6324e-07 -1.73333e-05 17.4609 -1.63918e-05 39L-1.38827e-05 96.4C-1.37379e-05 99.7137 2.68628 102.4 5.99999 102.4L7.99999 102.4C20.4264 102.4 30.5 112.474 30.5 124.9L30.5 288.9C30.5 301.326 20.4264 311.4 8 311.4L5.99757 311.4C2.68497 311.401 -4.36733e-06 314.087 -4.22252e-06 317.4L-1.70474e-06 375Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-12-mini": {
    portrait: {
      left: 23, top: 20, width: 360, height: 780,
      paths: {
        portrait: "M0.012382 48.8761C0.00414172 49.2498 0 49.6244 0 50V730C0 730.471 0.0065182 730.941 0.0194694 731.409C0.00408733 732.482 0.0129916 733.577 0.0476516 734.688C0.201806 739.633 0.843653 744.212 1.81724 748.003C4.78473 761.53 14.6847 772.46 27.6043 776.881C31.9306 778.566 38.1065 779.726 44.9896 779.94C46.0854 779.974 47.1648 779.983 48.2231 779.969C48.8128 779.99 49.4052 780 50 780H310C310.586 780 311.169 779.99 311.749 779.97C312.784 779.983 313.84 779.974 314.91 779.94C321.793 779.726 327.969 778.566 332.296 776.881C345.215 772.46 355.115 761.53 358.083 748.003C359.056 744.212 359.698 739.633 359.852 734.688C359.865 734.288 359.874 733.891 359.88 733.495C359.959 732.34 360 731.175 360 730V50C360 48.8273 359.96 47.664 359.88 46.5115C359.874 46.1059 359.865 45.6977 359.852 45.2873C359.698 40.3431 359.056 35.7639 358.083 31.9729C355.115 18.4459 345.215 7.51537 332.296 3.09416C327.969 1.4099 321.793 0.250069 314.91 0.0354614C313.655 -0.00368887 312.421 -0.00997896 311.215 0.0144741C310.811 0.0048429 310.406 0 310 0H295C291.686 0 289 2.68629 289 6V8C289 21.8071 277.807 33 264 33H96C82.1929 33 71 21.8071 71 8V6C71 2.68629 68.3137 0 65 0H50C49.5765 0 49.1543 0.00526451 48.7333 0.0157317C47.5086 -0.0101806 46.2541 -0.00434601 44.9774 0.0354614C38.0943 0.250069 31.9184 1.4099 27.5921 3.09416C14.6725 7.51537 4.77252 18.4459 1.80504 31.9729C0.831446 35.7639 0.189599 40.3431 0.0354446 45.2873C-0.00255409 46.506 -0.00959624 47.7044 0.012382 48.8761Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 20, top: 23, width: 780, height: 360,
      paths: {
        landscape: "M48.8761 359.988C49.2498 359.996 49.6244 360 50 360L730 360C730.471 360 730.941 359.993 731.409 359.98C732.482 359.996 733.577 359.987 734.688 359.952C739.633 359.798 744.212 359.156 748.003 358.183C761.53 355.215 772.46 345.315 776.881 332.396C778.566 328.069 779.726 321.893 779.94 315.01C779.974 313.915 779.983 312.835 779.969 311.777C779.99 311.187 780 310.595 780 310L780 50C780 49.4144 779.99 48.8313 779.97 48.2506C779.983 47.2155 779.974 46.1605 779.94 45.0897C779.726 38.2066 778.566 32.0307 776.881 27.7044C772.46 14.7848 761.53 4.88479 748.003 1.9173C744.212 0.943724 739.632 0.301878 734.688 0.147703C734.288 0.135222 733.891 0.126097 733.495 0.120238C732.34 0.0404953 731.175 -3.19607e-05 730 -3.19093e-05L50 -2.18557e-06C48.8273 -2.13431e-06 47.664 0.0403727 46.5114 0.11981C46.1058 0.125669 45.6977 0.134947 45.2873 0.147734C40.3431 0.301909 35.7638 0.943755 31.9729 1.91733C18.4459 4.88483 7.51536 14.7848 3.09415 27.7044C1.40988 32.0307 0.250055 38.2066 0.0354477 45.0897C-0.00370258 46.3454 -0.00999261 47.5795 0.0144605 48.785C0.00482932 49.1888 -1.35683e-05 49.5938 -1.35505e-05 50L-1.28949e-05 65C-1.275e-05 68.3137 2.68628 71 5.99999 71L7.99999 71C21.8071 71 33 82.1929 33 96L33 264C33 277.807 21.8071 289 8 289L6 289C2.68629 289 -2.98609e-06 291.686 -2.84124e-06 295L-2.18557e-06 310C-2.16706e-06 310.423 0.00526236 310.846 0.0157295 311.267C-0.0101827 312.491 -0.00434803 313.746 0.0354595 315.023C0.250067 321.906 1.4099 328.082 3.09416 332.408C7.51537 345.327 18.4459 355.227 31.9729 358.195C35.7639 359.169 40.3431 359.81 45.2873 359.965C46.506 360.003 47.7044 360.01 48.8761 359.988Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-12": {
    portrait: {
      left: 24, top: 21, width: 390, height: 844,
      paths: {
        portrait: "M47 0C21.0426 0 0 21.0426 0 47V797C0 822.957 21.0426 844 47 844H343C368.957 844 390 822.957 390 797V47C390 21.0426 368.957 0 343 0H300V7.79471C300 20.6106 289.611 31 276.795 31H112.196C99.9376 31 89.9999 21.0623 89.9999 8.80364V4.40874C89.2819 1.86701 86.9453 0.00442505 84.1738 0.00442505H89.9999V0H47ZM300.173 0.00442505H306.226C302.883 0.00442505 300.173 2.7147 300.173 6.05798V0.00442505Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 21, top: 24, width: 844, height: 390,
      paths: {
        landscape: "M4.45139 90.1274C1.99294 90.1274 -1.3195e-05 88.1334 -1.33025e-05 85.6735L-1.49789e-05 47.3233C-1.61213e-05 21.1876 21.1752 0.000334768 47.2961 0.000333626L796.704 2.62101e-05C822.825 2.50683e-05 844 21.1873 844 47.3231L844 342.677C844 368.813 822.825 390 796.704 390L47.2962 390C21.1752 390 1.4324e-05 368.813 1.31816e-05 342.677L1.30131e-05 338.824L-2.23749e-06 338.812L-3.74498e-06 304.325C-3.8525e-06 301.865 1.99296 299.871 4.4514 299.871L8.4942 299.871C21.322 299.779 31.6924 289.345 31.6924 276.488L31.6923 113.512C31.6923 100.597 21.2293 90.1284 8.32248 90.1284L4.45139 90.1274Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-12-pro": {
    portrait: {
      left: 24, top: 21, width: 390, height: 844,
      paths: {
        portrait: "M47 0C21.0426 0 0 21.0426 0 47V797C0 822.957 21.0426 844 47 844H343C368.957 844 390 822.957 390 797V47C390 21.0426 368.957 0 343 0H300V7.79471C300 20.6106 289.611 31 276.795 31H112.196C99.9376 31 89.9999 21.0623 89.9999 8.80364V4.40874C89.2819 1.86701 86.9453 0.00442505 84.1738 0.00442505H89.9999V0H47ZM300.173 0.00442505H306.226C302.883 0.00442505 300.173 2.7147 300.173 6.05798V0.00442505Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 21, top: 24, width: 844, height: 390,
      paths: {
        landscape: "M-2.05444e-06 343C-9.19802e-07 368.957 21.0426 390 47 390L797 390C822.957 390 844 368.957 844 343L844 47C844 21.0426 822.957 -3.59726e-05 797 -3.4838e-05L47 -2.05444e-06C21.0426 -9.19802e-07 -1.61276e-05 21.0426 -1.4993e-05 47L-1.31134e-05 90.0001L7.7947 90.0001C20.6106 90.0001 31 100.389 31 113.205L31 277.804C31 290.062 21.0623 300 8.80363 300L4.40873 300C1.867 300.718 0.00442125 303.055 0.00442137 305.826L0.00442111 300L-3.93402e-06 300L-2.05444e-06 343ZM0.00441193 89.8275L0.00441166 83.7739C0.00441181 87.1172 2.71468 89.8275 6.05797 89.8275L0.00441193 89.8275Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-12-pro-max": {
    portrait: {
      left: 25, top: 21, width: 428, height: 926,
      paths: {
        portrait: "M104.03 0C107.33 0.0159257 110 2.69609 110 5.99993V9.69993C110 21.8502 119.85 31.6999 132 31.6999H296C308.703 31.6999 319 21.4025 319 8.69994V5.99993C319 2.69609 321.671 0.0159257 324.971 0H375C404.271 0 428 23.7289 428 53V873C428 902.271 404.271 926 375 926H53C23.7289 926 0 902.271 0 873V53C0 23.7289 23.7289 0 53 0H104.03Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 21, top: 25, width: 926, height: 428,
      paths: {
        landscape: "M-4.54729e-06 323.97C0.015921 320.67 2.69608 318 5.99993 318L9.69993 318C21.8502 318 31.6999 308.15 31.6999 296L31.6999 132C31.6999 119.297 21.4025 109 8.69992 109L5.99992 109C2.69607 109 0.0159117 106.329 -1.42049e-05 103.029L-1.63918e-05 53C-1.76713e-05 23.7289 23.7289 -1.03722e-06 53 -2.3167e-06L873 -3.816e-05C902.271 -3.94395e-05 926 23.7289 926 53L926 375C926 404.271 902.271 428 873 428L53 428C23.7289 428 -1.03722e-06 404.271 -2.3167e-06 375L-4.54729e-06 323.97Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-13-mini-2021": {
    portrait: {
      left: 24, top: 19, width: 375, height: 812,
      paths: {
        portrait: "M59.6098 0H106.259C108.653 0 110.594 1.94269 110.594 4.33935V10.3059C110.594 20.7909 119.086 29.2906 129.561 29.2906H246.981C257.456 29.2906 265.948 20.7909 265.948 10.3059V4.33935C265.948 1.94269 267.889 0 270.283 0H315.39C334.628 0 349.394 2.22715 360.098 12.4756C371.443 23.3383 375 34.986 375 59.666V655.298C375 659.808 375 660.916 375 663.656V752.649C375 777.329 371.985 788.662 360.639 799.524C349.936 809.773 335.17 812 315.932 812H60.1517C40.914 812 26.1481 809.773 15.4444 799.524C4.09924 788.662 0.000276357 776.848 0.000276357 752.168V159.042C0.000664003 156.156 0 151.363 0 148.623V59.666C0 34.986 3.55733 23.3383 14.9025 12.4756C25.6062 2.22715 40.3721 0 59.6098 0Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 19, top: 24, width: 812, height: 375,
      paths: {
        landscape: "M-2.60563e-06 315.39L-4.64471e-06 268.741C-4.74936e-06 266.347 1.94269 264.406 4.33934 264.406L10.3059 264.406C20.7909 264.406 29.2906 255.914 29.2906 245.439L29.2906 128.019C29.2906 117.544 20.7909 109.052 10.3059 109.052L4.33933 109.052C1.94268 109.052 -1.17098e-05 107.111 -1.18145e-05 104.717L-1.37861e-05 59.6098C-1.46271e-05 40.3721 2.22713 25.6062 12.4756 14.9025C23.3383 3.55732 34.986 1.37295e-05 59.666 1.26507e-05L655.298 -1.33852e-05C659.808 -1.35823e-05 660.916 -1.36308e-05 663.656 -1.37505e-05L752.649 -1.76405e-05C777.329 -1.87193e-05 788.662 3.01538 799.524 14.3605C809.773 25.0642 812 39.8302 812 59.0679L812 314.848C812 334.086 809.773 348.852 799.524 359.556C788.662 370.901 776.848 375 752.168 375L159.042 375C156.156 374.999 151.363 375 148.623 375L59.666 375C34.986 375 23.3383 371.443 12.4756 360.098C2.22715 349.394 -1.76472e-06 334.628 -2.60563e-06 315.39Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-13-2021": {
    portrait: {
      left: 26, top: 22, width: 390, height: 844,
      paths: {
        portrait: "M61.9942 0H109.789C112.279 0 114.298 2.01925 114.298 4.51035V12.7121C114.298 23.6103 124.129 33.4449 135.023 33.4449H255.54C264 33.4449 275.266 24.6103 275.266 13.7121V4.51035C275.266 2.01925 277.285 0 279.775 0H328.006C348.013 0 363.868 2.34765 375 13C386.799 24.2908 390 36.3647 390 62.0174V681.122C390 685.81 390 686.962 390 689.81V782.31C390 807.963 386.864 819.742 375.065 831.033C363.933 841.685 348.577 844 328.569 844H62.5578C40.5 844 26.1319 841.652 15 831C3.20107 819.709 0.000287411 807.463 0.000287411 781.81V165.31C0.000690563 162.31 0 157.328 0 154.48V62.0174C0 36.3647 3.20107 24.2908 15 13C26.1319 2.34765 41.987 0 61.9942 0Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 22, top: 26, width: 844, height: 390,
      paths: {
        landscape: "M-2.70985e-06 328.006L-4.79903e-06 280.211C-4.90787e-06 277.721 2.01925 275.702 4.51035 275.702L12.7121 275.702C23.6103 275.702 33.4449 265.871 33.4449 254.977L33.4449 134.46C33.4449 126 24.6103 114.734 13.7121 114.734L4.51034 114.734C2.01924 114.734 -1.21205e-05 112.715 -1.22293e-05 110.225L-1.43376e-05 61.9942C-1.52121e-05 41.987 2.34763 26.1319 13 15C24.2907 3.20106 36.3647 2.8928e-05 62.0174 2.78067e-05L681.122 7.44774e-07C685.81 5.39874e-07 686.962 4.89525e-07 689.81 3.65028e-07L782.31 -3.67828e-06C807.963 -4.79959e-06 819.742 3.13603 831.033 14.935C841.685 26.0668 844 41.4234 844 61.4306L844 327.442C844 349.5 841.652 363.868 831 375C819.709 386.799 807.463 390 781.81 390L165.31 390C162.31 389.999 157.328 390 154.48 390L62.0174 390C36.3647 390 24.2908 386.799 13 375C2.34765 363.868 -1.83531e-06 348.013 -2.70985e-06 328.006Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-13-pro-2021": {
    portrait: {
      left: 23, top: 18, width: 390, height: 844,
      paths: {
        portrait: "M61.9942 0H117.789C120.279 0 122.298 2.01925 122.298 4.51035V10.7121C122.298 21.6103 131.129 30.4449 142.023 30.4449H248.54C259.435 30.4449 268.266 21.6103 268.266 10.7121V4.51035C268.266 2.01925 270.285 0 272.775 0H328.006C348.013 0 363.37 2.31491 374.501 12.9673C386.3 24.258 390 36.3647 390 62.0174V681.122C390 685.81 390 686.962 390 689.81V782.31C390 807.963 386.864 819.742 375.065 831.033C363.933 841.685 348.577 844 328.569 844H62.5578C42.5506 844 27.194 841.685 16.0621 831.033C4.2632 819.742 0.000287411 807.463 0.000287411 781.81V165.31C0.000690563 162.31 0 157.328 0 154.48V62.0174C0 36.3647 3.69962 24.258 15.4986 12.9673C26.6304 2.31491 41.987 0 61.9942 0Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 18, top: 23, width: 844, height: 390,
      paths: {
        landscape: "M-2.70985e-06 328.006L-5.14872e-06 272.211C-5.25756e-06 269.721 2.01925 267.702 4.51035 267.702L10.7121 267.702C21.6103 267.702 30.4449 258.871 30.4449 247.977L30.4449 141.46C30.4449 130.565 21.6103 121.734 10.7121 121.734L4.51034 121.734C2.01924 121.734 -1.18145e-05 119.715 -1.19234e-05 117.225L-1.43376e-05 61.9942C-1.52121e-05 41.987 2.3149 26.6304 12.9673 15.4986C24.258 3.69963 36.3647 2.8928e-05 62.0174 2.78067e-05L681.122 7.44774e-07C685.81 5.39874e-07 686.962 4.89525e-07 689.81 3.65028e-07L782.31 -3.67828e-06C807.963 -4.79959e-06 819.742 3.13603 831.033 14.935C841.685 26.0668 844 41.4234 844 61.4306L844 327.442C844 347.449 841.685 362.806 831.033 373.938C819.742 385.737 807.463 390 781.81 390L165.31 390C162.31 389.999 157.328 390 154.48 390L62.0174 390C36.3647 390 24.258 386.3 12.9673 374.501C2.31491 363.37 -1.83531e-06 348.013 -2.70985e-06 328.006Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-13-pro-max-2021": {
    portrait: {
      left: 28, top: 24, width: 428, height: 926,
      paths: {
        portrait: "M68.0347 0H120.266C122.998 0 125.214 2.21544 125.214 4.94856V11.7528C125.214 28.7099 138.906 37.4028 149.861 37.4028H276.757C291.713 37.4028 302.405 23.7099 302.405 10.7528V4.94856C302.405 2.21544 304.62 0 307.353 0H359.965C381.922 0 398.783 2.3127 411 14C423.949 26.3877 428 39.8978 428 68.0428V747.298C428 752.441 428 753.705 428 756.829V858.316C428 886.461 424.449 899.612 411.5 912C399.283 923.687 382.54 926 360.584 926H68.6532C46.6965 926 28.2165 923.187 16 911.5C3.05142 899.112 0.000315428 885.913 0.000315428 857.768V181.371C0.000757861 178.079 0 172.613 0 169.488V68.0428C0 39.8978 3.05142 26.8877 16 14.5C28.2165 2.8127 46.078 0 68.0347 0Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 24, top: 28, width: 926, height: 428,
      paths: {
        landscape: "M-2.97389e-06 359.965L-5.25699e-06 307.734C-5.37643e-06 305.002 2.21543 302.786 4.94856 302.786L11.7528 302.786C28.7098 302.786 37.4028 289.094 37.4028 278.139L37.4028 151.243C37.4028 136.287 23.7098 125.595 10.7528 125.595L4.94855 125.595C2.21542 125.595 -1.33154e-05 123.38 -1.34348e-05 120.647L-1.57346e-05 68.0347C-1.66943e-05 46.078 2.31268 29.2165 14 17C26.3877 4.05144 39.8978 1.73295e-05 68.0427 1.60992e-05L747.298 -1.35919e-05C752.441 -1.38167e-05 753.705 -1.3872e-05 756.829 -1.40086e-05L858.316 -1.84447e-05C886.461 -1.9675e-05 899.612 3.5514 912 16.5C923.687 28.7165 926 45.4595 926 67.4162L926 359.347C926 381.303 923.187 399.783 911.5 412C899.112 424.949 885.913 428 857.768 428L181.371 428C178.079 427.999 172.613 428 169.488 428L68.0428 428C39.8978 428 26.8877 424.949 14.5 412C2.8127 399.783 -2.01413e-06 381.922 -2.97389e-06 359.965Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-14-2022": {
    portrait: {
      left: 23, top: 20, width: 390, height: 844,
      paths: {
        portrait: "M0 60C0 38 3.30097 24.4001 14.5 13.5C25.3088 2.97971 39.5 0 60 0H115C118.314 0 121 2.68629 121 6V11H121.052C121.822 22.1743 131.13 31 142.5 31H247.5C259.207 31 268.729 21.6432 268.994 10H269V6C269 2.68629 271.686 0 275 0H330C350.5 0 364.691 2.97971 375.5 13.5C386.699 24.4001 390 38 390 60V784C390 806 386.699 819.6 375.5 830.5C364.691 841.02 350.5 844 330 844H60C39.5 844 25.3088 841.02 14.5 830.5C3.30097 819.6 0 806 0 784V60Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 20, top: 23, width: 844, height: 390,
      paths: {
        landscape: "M60 390C38 390 24.4001 386.699 13.5 375.5C2.9797 364.691 -1.7266e-06 350.5 -2.62268e-06 330L-5.02681e-06 275C-5.17166e-06 271.686 2.68629 269 5.99999 269L11 269L11 268.948C22.1743 268.178 31 258.87 31 247.5L31 142.5C31 130.793 21.6432 121.271 9.99999 121.006L9.99999 121L5.99999 121C2.68628 121 -1.18758e-05 118.314 -1.20206e-05 115L-1.44248e-05 60C-1.53208e-05 39.5 2.97969 25.3088 13.5 14.5C24.4 3.30096 38 -1.66103e-06 60 -2.62268e-06L784 -3.42697e-05C806 -3.52314e-05 819.6 3.30093 830.5 14.5C841.02 25.3088 844 39.5 844 60L844 330C844 350.5 841.02 364.691 830.5 375.5C819.6 386.699 806 390 784 390L60 390Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-14-max-2022": {
    portrait: {
      left: 26, top: 21, width: 428, height: 926,
      paths: {
        portrait: "M0 65.8294C0 41.6919 3.62261 26.7707 15.9128 14.8116C27.7748 3.2692 43.3487 0 65.8462 0H126.205C129.838 0 132.783 2.94728 132.783 6.58294V12.0687H132.839C133.683 24.3287 143.888 34.0118 156.352 34.0118H271.458C284.292 34.0118 294.73 23.7459 295.021 10.9716H295.028V6.58294C295.028 2.94728 297.972 0 301.605 0H362.154C384.651 0 400.225 3.2692 412.087 14.8116C424.365 26.7582 427.992 41.6608 428 65.7539V860.246C427.992 884.339 424.365 899.242 412.087 911.188C400.225 922.731 384.651 926 362.154 926H65.8462C43.3487 926 27.7748 922.731 15.9128 911.188C3.62261 899.229 0 884.308 0 860.171V65.8294Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 21, top: 26, width: 926, height: 428,
      paths: {
        landscape: "M65.8294 428C41.6919 428 26.7707 424.377 14.8116 412.087C3.2692 400.225 -1.89483e-06 384.651 -2.87823e-06 362.154L-5.5166e-06 301.795C-5.67539e-06 298.162 2.94728 295.217 6.58293 295.217L12.0687 295.217L12.0687 295.161C24.3287 294.317 34.0118 284.112 34.0118 271.648L34.0118 156.542C34.0118 143.708 23.7459 133.27 10.9716 132.979L10.9716 132.972L6.58293 132.972C2.94727 132.972 -1.30248e-05 130.028 -1.31836e-05 126.395L-1.58302e-05 65.8461C-1.68136e-05 43.3487 3.26919 27.7748 14.8116 15.9128C26.7582 3.63544 41.6608 0.00756654 65.7539 -2.8742e-06L860.246 -3.76025e-05C884.339 0.0075297 899.242 3.6354 911.188 15.9128C922.731 27.7748 926 43.3487 926 65.8461L926 362.154C926 384.651 922.731 400.225 911.188 412.087C899.229 424.377 884.308 428 860.171 428L65.8294 428Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-14-pro-2022": {
    portrait: {
      left: 23, top: 21, width: 390, height: 844,
      paths: {
        portrait: "M16.8575 15.0065C2.83905 28.6487 0 43.2004 0 73.6681V688.478V770.332C0 800.8 2.83905 815.351 16.8575 828.994C30.158 841.937 46.9276 844 73.8084 844H178.598H211.402H316.192C343.072 844 359.842 841.937 373.143 828.994C387.161 815.351 390 800.8 390 770.332V688.478V155.521V73.6681C390 43.2004 387.161 28.6487 373.143 15.0065C359.842 2.06283 343.072 0 316.192 0H211.402H73.8084C46.9276 0 30.158 2.06283 16.8575 15.0065ZM134.313 29.058C134.313 19.8912 141.745 12.46 150.912 12.46H193.346C202.513 12.46 209.944 19.8912 209.944 29.058C209.944 38.2249 202.513 45.6561 193.346 45.6561H150.912C141.745 45.6561 134.313 38.2249 134.313 29.058ZM238.693 12.46C229.526 12.46 222.063 19.8912 222.063 29.058C222.063 38.2249 229.526 45.6561 238.693 45.6561C247.86 45.6561 255.323 38.2249 255.323 29.058C255.323 19.8912 247.86 12.46 238.693 12.46Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 21, top: 23, width: 844, height: 390,
      paths: {
        landscape: "M15.0065 373.143C28.6487 387.161 43.2004 390 73.6681 390L688.478 390L770.332 390C800.8 390 815.351 387.161 828.994 373.142C841.937 359.842 844 343.072 844 316.192L844 211.402L844 178.598L844 73.8084C844 46.9275 841.937 30.158 828.994 16.8574C815.351 2.83901 800.8 -3.50041e-05 770.332 -3.36723e-05L688.478 -3.00943e-05L155.521 -6.79806e-06L73.6681 -3.22014e-06C43.2004 -1.88835e-06 28.6487 2.83905 15.0064 16.8575C2.06282 30.158 -1.49962e-05 46.9276 -1.38212e-05 73.8084L-9.24068e-06 178.598L-3.22627e-06 316.192C-2.05127e-06 343.072 2.06283 359.842 15.0065 373.143ZM29.058 255.687C19.8912 255.687 12.46 248.255 12.46 239.088L12.46 196.654C12.46 187.487 19.8912 180.056 29.058 180.056C38.2249 180.056 45.6561 187.487 45.6561 196.654L45.6561 239.088C45.6561 248.255 38.2249 255.687 29.058 255.687ZM12.46 151.307C12.46 160.474 19.8912 167.937 29.058 167.937C38.2249 167.937 45.6561 160.474 45.6561 151.307C45.6561 142.14 38.2249 134.677 29.058 134.677C19.8912 134.677 12.46 142.14 12.46 151.307Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-14-pro-max-2022": {
    portrait: {
      left: 26, top: 23, width: 428, height: 928,
      paths: {
        portrait: "M18.5 16.5C3.11567 31.5 0 47.5 0 81V847C0 880.5 3.11567 896.5 18.5 911.5C33.0965 925.732 51.5 928 81 928H347C376.5 928 394.904 925.732 409.5 911.5C424.884 896.5 428 880.5 428 847V81C428 47.5 424.884 31.5 409.5 16.5C394.904 2.26814 376.5 0 347 0H81C51.5 0 33.0965 2.26814 18.5 16.5ZM147.4 31.95C147.4 21.8708 155.571 13.7 165.65 13.7H212.15C222.23 13.7 230.4 21.8708 230.4 31.95C230.4 42.0292 222.23 50.2 212.15 50.2H165.65C155.571 50.2 147.4 42.0292 147.4 31.95ZM261.95 13.7C251.871 13.7 243.7 21.8708 243.7 31.95C243.7 42.0291 251.871 50.2 261.95 50.2C272.029 50.2 280.2 42.0291 280.2 31.95C280.2 21.8708 272.029 13.7 261.95 13.7Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 23, top: 26, width: 928, height: 428,
      paths: {
        landscape: "M16.5 409.5C31.5 424.884 47.5 428 81 428L847 428C880.5 428 896.5 424.884 911.5 409.5C925.732 394.903 928 376.5 928 347L928 81C928 51.5 925.732 33.0965 911.5 18.5C896.5 3.11562 880.5 -3.84879e-05 847 -3.70235e-05L81 -3.54062e-06C47.5 -2.07629e-06 31.5 3.11566 16.5 18.5C2.26812 33.0965 -1.64573e-05 51.5 -1.51679e-05 81L-3.54062e-06 347C-2.25114e-06 376.5 2.26814 394.903 16.5 409.5ZM31.95 280.6C21.8708 280.6 13.7 272.429 13.7 262.35L13.7 215.85C13.7 205.77 21.8708 197.6 31.95 197.6C42.0292 197.6 50.2 205.77 50.2 215.85L50.2 262.35C50.2 272.429 42.0292 280.6 31.95 280.6ZM13.6999 166.05C13.6999 176.129 21.8707 184.3 31.9499 184.3C42.0291 184.3 50.1999 176.129 50.1999 166.05C50.1999 155.971 42.0291 147.8 31.9499 147.8C21.8707 147.8 13.6999 155.971 13.6999 166.05Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-15-2023": {
    portrait: {
      left: 21, top: 17, width: 393, height: 852,
      paths: {
        portrait: "M14.5 14.5C25.4948 4.00859 40.3832 0.0310924 57.3009 0.00018177L335.5 0C352.5 0 367.462 3.96745 378.5 14.5C390.237 25.6997 393 41 393 58V794C393 811 390.237 826.3 378.5 837.5C367.462 848.033 352.5 852 335.5 852H57.5C40.5 852 25.5379 848.033 14.5 837.5C2.76288 826.3 0 811 0 794V58C0 41 2.76288 25.6997 14.5 14.5ZM139.7 27.25C139.7 18.2754 146.976 11 155.95 11H193.45C202.425 11 209.7 18.2754 209.7 27.25C209.7 36.2246 202.425 43.5 193.45 43.5H155.95C146.976 43.5 139.7 36.2246 139.7 27.25ZM253.1 27.25C253.1 36.2246 245.824 43.5 236.85 43.5C227.875 43.5 220.6 36.2246 220.6 27.25C220.6 18.2754 227.875 11 236.85 11C245.824 11 253.1 18.2754 253.1 27.25Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 17, top: 21, width: 852, height: 393,
      paths: {
        landscape: "M15 379C4.50859 368.005 0.531091 353.117 0.500179 336.199L0.499985 58C0.499985 41 4.46744 26.0379 15 15C26.1997 3.26288 41.5 0.499998 58.5 0.499997L794.5 0.499965C811.5 0.499965 826.8 3.26284 838 15C848.533 26.0379 852.5 41 852.5 58L852.5 336C852.5 353 848.533 367.962 838 379C826.8 390.737 811.5 393.5 794.5 393.5L58.5 393.5C41.5 393.5 26.1997 390.737 15 379ZM27.75 253.8C18.7754 253.8 11.5 246.524 11.5 237.55L11.5 200.05C11.5 191.075 18.7754 183.8 27.75 183.8C36.7246 183.8 44 191.075 44 200.05L44 237.55C44 246.524 36.7246 253.8 27.75 253.8ZM27.75 140.4C36.7246 140.4 44 147.676 44 156.65C44 165.625 36.7246 172.9 27.75 172.9C18.7754 172.9 11.5 165.625 11.5 156.65C11.5 147.676 18.7754 140.4 27.75 140.4Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-15-plus-2023": {
    portrait: {
      left: 23, top: 18, width: 430, height: 932,
      paths: {
        portrait: "M17 16C1.37716 31 0 50.1548 0 70V131V801V862C0 881.845 1.37716 901 17 916C30.8162 929.265 48.45 931.244 65.6039 931.864C67.0577 931.954 68.5235 932 70 932H131H299H360C361.472 932 362.934 931.955 364.384 931.865C381.611 931.245 399.678 929.271 413.5 916C429.123 901 430 883 430 862V801V131V70C430 49 429.123 31 413.5 16C399.678 2.7292 381.611 0.754562 364.384 0.135044C362.934 0.0454568 361.472 0 360 0H299H131H70C68.5235 0 67.0577 0.0457136 65.6039 0.135803C48.4501 0.756178 30.8162 2.73463 17 16ZM170.55 12.6001C160.747 12.6001 152.8 20.547 152.8 30.3501C152.8 40.1532 160.747 48.1001 170.55 48.1001H216.89C226.693 48.1001 234.64 40.1532 234.64 30.3501C234.64 20.547 226.693 12.6001 216.89 12.6001H170.55ZM259.25 12.6001C249.447 12.6001 241.5 20.547 241.5 30.3501C241.5 40.1532 249.447 48.1001 259.25 48.1001C269.053 48.1001 277 40.1532 277 30.3501C277 20.547 269.053 12.6001 259.25 12.6001Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 18, top: 23, width: 932, height: 430,
      paths: {
        landscape: "M16 413C31 428.623 50.1548 430 70 430L131 430L801 430L862 430C881.845 430 901 428.623 916 413C929.265 399.184 931.244 381.55 931.864 364.396C931.954 362.942 932 361.476 932 360L932 299L932 131L932 70C932 68.5276 931.955 67.0659 931.865 65.6161C931.245 48.389 929.271 30.3218 916 16.5C901 0.877127 883 -3.85972e-05 862 -3.76792e-05L801 -3.50128e-05L131 -5.72619e-06L70 -3.0598e-06C49 -2.14186e-06 31 0.877165 16 16.5C2.72918 30.3218 0.754545 48.389 0.135028 65.6161C0.0454409 67.0659 -1.58005e-05 68.5276 -1.57361e-05 70L-1.30697e-05 131L-5.72619e-06 299L-3.0598e-06 360C-2.99526e-06 361.477 0.0457107 362.942 0.1358 364.396C0.756176 381.55 2.73463 399.184 16 413ZM12.6001 259.45C12.6001 269.253 20.547 277.2 30.3501 277.2C40.1531 277.2 48.1001 269.253 48.1001 259.45L48.1001 213.11C48.1001 203.307 40.1531 195.36 30.3501 195.36C20.547 195.36 12.6001 203.307 12.6001 213.11L12.6001 259.45ZM12.6001 170.75C12.6001 180.553 20.547 188.5 30.3501 188.5C40.1531 188.5 48.1001 180.553 48.1001 170.75C48.1001 160.947 40.1531 153 30.3501 153C20.547 153 12.6001 160.947 12.6001 170.75Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-15-pro-2023": {
    portrait: {
      left: 20, top: 16, width: 393, height: 852,
      paths: {
        portrait: "M0 61.5C0 43 5.26288 27.1997 17 16C28.0379 5.46745 43.5 0 61.5 0H331.5C349.5 0 364.962 5.46745 376 16C387.737 27.1997 393 43 393 61.5V790.5C393 809 387.737 824.8 376 836C364.962 846.533 349.5 852 331.5 852H61.5C43.5 852 28.0379 846.533 17 836C5.26288 824.8 0 809 0 790.5V61.5ZM134.705 27.2727C134.57 28.1621 134.5 29.0728 134.5 30C134.5 39.2335 141.452 46.8432 150.408 47.8797C151.039 47.9472 151.679 47.9817 152.328 47.9817H192.628C193.564 47.9817 194.484 47.9096 195.382 47.7705C202.823 46.573 208.738 40.815 210.169 33.4551C210.371 32.3783 210.478 31.2674 210.478 30.1317C210.478 20.2735 202.486 12.2817 192.628 12.2817H152.328C143.442 12.2817 136.074 18.7735 134.705 27.2727ZM258.431 31.5911C257.625 40.787 249.905 48 240.5 48C230.559 48 222.5 39.9411 222.5 30C222.5 29.5597 222.516 29.1231 222.547 28.6907C223.352 19.4948 231.073 12.2817 240.478 12.2817C250.419 12.2817 258.478 20.3406 258.478 30.2817C258.478 30.722 258.462 31.1587 258.431 31.5911Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 16, top: 20, width: 852, height: 393,
      paths: {
        landscape: "M62 393.5C43.5 393.5 27.6997 388.237 16.5 376.5C5.96745 365.462 0.499998 350 0.499997 332L0.499986 62C0.499985 44 5.96744 28.5379 16.5 17.5C27.6997 5.76288 43.5 0.499998 62 0.499997L791 0.499965C809.5 0.499965 825.3 5.76284 836.5 17.5C847.033 28.5379 852.5 44 852.5 62L852.5 332C852.5 350 847.033 365.462 836.5 376.5C825.3 388.237 809.5 393.5 791 393.5L62 393.5ZM27.7727 258.795C28.6621 258.93 29.5728 259 30.5 259C39.7335 259 47.3432 252.048 48.3797 243.092C48.4471 242.461 48.4817 241.821 48.4817 241.172L48.4817 200.872C48.4817 199.936 48.4096 199.016 48.2705 198.118C47.073 190.677 41.315 184.762 33.9551 183.331C32.8783 183.129 31.7674 183.022 30.6317 183.022C20.7734 183.022 12.7817 191.014 12.7817 200.872L12.7817 241.172C12.7817 250.058 19.2735 257.426 27.7727 258.795ZM32.091 135.069C41.2869 135.875 48.5 143.595 48.5 153C48.5 162.941 40.4411 171 30.5 171C30.0597 171 29.6231 170.984 29.1907 170.953C19.9948 170.148 12.7817 162.427 12.7817 153.022C12.7817 143.081 20.8406 135.022 30.7817 135.022C31.222 135.022 31.6587 135.038 32.091 135.069Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-15-pro-max-2023": {
    portrait: {
      left: 19, top: 16, width: 430, height: 932,
      paths: {
        portrait: "M17 16C1.37716 31 0 50.1548 0 70V862C0 881.845 1.37716 901 17 916C30.8162 929.265 48.45 931.244 65.6039 931.864C67.0577 931.954 68.5235 932 70 932H360C361.472 932 362.934 931.955 364.384 931.865C381.611 931.245 399.678 929.271 413.5 916C429.123 901 430 883 430 862V70C430 49 429.123 31 413.5 16C399.678 2.7292 381.611 0.754562 364.384 0.135044C362.934 0.0454568 361.472 0 360 0H70C68.5235 0 67.0577 0.0457136 65.6039 0.135803C48.4501 0.756178 30.8162 2.73463 17 16ZM170.55 12.6001C160.747 12.6001 152.8 20.547 152.8 30.3501C152.8 40.1532 160.747 48.1001 170.55 48.1001H216.89C226.693 48.1001 234.64 40.1532 234.64 30.3501C234.64 20.547 226.693 12.6001 216.89 12.6001H170.55ZM259.25 12.6001C249.447 12.6001 241.5 20.547 241.5 30.3501C241.5 40.1532 249.447 48.1001 259.25 48.1001C269.053 48.1001 277 40.1532 277 30.3501C277 20.547 269.053 12.6001 259.25 12.6001Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 16, top: 19, width: 932, height: 430,
      paths: {
        landscape: "M16 413C31 428.623 50.1548 430 70 430L862 430C881.845 430 901 428.623 916 413C929.265 399.184 931.244 381.55 931.864 364.396C931.954 362.942 932 361.476 932 360L932 70C932 68.5276 931.955 67.0659 931.865 65.6161C931.245 48.389 929.271 30.3218 916 16.5C901 0.877127 883 -3.85972e-05 862 -3.76792e-05L70 -3.0598e-06C49 -2.14186e-06 31 0.877165 16 16.5C2.72918 30.3218 0.754545 48.389 0.135028 65.6161C0.0454409 67.0659 -1.58005e-05 68.5276 -1.57361e-05 70L-3.0598e-06 360C-2.99526e-06 361.477 0.0457107 362.942 0.1358 364.396C0.756176 381.55 2.73463 399.184 16 413ZM12.6001 259.45C12.6001 269.253 20.547 277.2 30.3501 277.2C40.1531 277.2 48.1001 269.253 48.1001 259.45L48.1001 213.11C48.1001 203.307 40.1531 195.36 30.3501 195.36C20.547 195.36 12.6001 203.307 12.6001 213.11L12.6001 259.45ZM12.6001 170.75C12.6001 180.553 20.547 188.5 30.3501 188.5C40.1531 188.5 48.1001 180.553 48.1001 170.75C48.1001 160.947 40.1531 153 30.3501 153C20.547 153 12.6001 160.947 12.6001 170.75Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-16-2024": {
    portrait: {
      left: 23, top: 20, width: 393, height: 852,
      paths: {
        portrait: "M16 16C27.5 5.5 41 0 64.5 0H334.5C353 0 366.462 5.96745 377.5 16.5C389.237 27.6997 393 46 393 63V789C393 806 388.737 824.8 377 836C365.962 846.533 350 852 333 852H60C43 852 27.7371 847.2 16 836C4.26288 824.8 0 807 0 790V60.5C0 46 4.26288 27.1997 16 16ZM223.3 29.35C223.3 19.7679 231.068 12 240.65 12C250.232 12 258 19.7679 258 29.35C258 38.9321 250.232 46.7 240.65 46.7C231.068 46.7 223.3 38.9321 223.3 29.35ZM152.05 12C142.468 12 134.7 19.7679 134.7 29.35C134.7 38.9321 142.468 46.7 152.05 46.7H194.35C203.932 46.7 211.7 38.9321 211.7 29.35C211.7 19.7679 203.932 12 194.35 12H152.05Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 20, top: 23, width: 852, height: 393,
      paths: {
        landscape: "M16.5 377.5C6 366 0.499998 352.5 0.499997 329L0.499985 59C0.499985 40.5 6.46744 27.0379 17 16C28.1997 4.26288 46.5 0.499998 63.5 0.499997L789.5 0.499966C806.5 0.499965 825.3 4.76284 836.5 16.5C847.033 27.5379 852.5 43.5 852.5 60.5L852.5 333.5C852.5 350.5 847.7 365.763 836.5 377.5C825.3 389.237 807.5 393.5 790.5 393.5L61 393.5C46.5 393.5 27.6997 389.237 16.5 377.5ZM29.85 170.2C20.2678 170.2 12.5 162.432 12.5 152.85C12.5 143.268 20.2678 135.5 29.85 135.5C39.4321 135.5 47.2 143.268 47.2 152.85C47.2 162.432 39.4321 170.2 29.85 170.2ZM12.5 241.45C12.5 251.032 20.2679 258.8 29.85 258.8C39.4321 258.8 47.2 251.032 47.2 241.45L47.2 199.15C47.2 189.568 39.4321 181.8 29.85 181.8C20.2678 181.8 12.5 189.568 12.5 199.15L12.5 241.45Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-16-plus-2024": {
    portrait: {
      left: 25, top: 22, width: 430, height: 932,
      paths: {
        portrait: "M17.5064 17.5023C30.0891 6.01643 44.8601 0 70.5725 0H365.992C386.234 0 400.964 6.52778 413.041 18.0493C425.883 30.3006 430 50.3193 430 68.9155V863.085C430 881.681 425.336 902.246 412.494 914.498C400.417 926.019 382.952 932 364.351 932H65.6489C47.0483 932 30.3485 926.749 17.5064 914.498C4.66422 902.246 0 882.775 0 864.178V66.1808C0 50.3193 4.66422 29.7537 17.5064 17.5023ZM244.324 32.1055C244.324 21.6236 252.826 13.1264 263.308 13.1264C273.789 13.1264 282.291 21.6236 282.291 32.1055C282.291 42.5873 273.789 51.0845 263.308 51.0845C252.826 51.0845 244.324 42.5873 244.324 32.1055ZM166.36 13.1264C155.878 13.1264 147.381 21.6236 147.381 32.1055C147.381 42.5873 155.878 51.0845 166.36 51.0845H212.651C223.133 51.0845 231.63 42.5873 231.63 32.1055C231.63 21.6236 223.133 13.1264 212.651 13.1264H166.36Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 22, top: 25, width: 932, height: 430,
      paths: {
        landscape: "M17.5023 412.494C6.01643 399.911 -1.9609e-06 385.14 -3.08482e-06 359.427L-1.5998e-05 64.0076C-1.68828e-05 43.7659 6.52776 29.0364 18.0493 16.9593C30.3006 4.11716 50.3192 -2.19952e-06 68.9155 -3.01239e-06L863.085 -3.77266e-05C881.681 -3.85395e-05 902.246 4.66418 914.498 17.5063C926.019 29.5834 932 47.0483 932 65.6488L932 364.351C932 382.952 926.749 399.651 914.498 412.494C902.246 425.336 882.775 430 864.178 430L66.1808 430C50.3193 430 29.7537 425.336 17.5023 412.494ZM32.1055 185.676C21.6236 185.676 13.1264 177.174 13.1264 166.692C13.1264 156.211 21.6236 147.709 32.1055 147.709C42.5873 147.709 51.0845 156.211 51.0845 166.692C51.0845 177.174 42.5873 185.676 32.1055 185.676ZM13.1264 263.64C13.1264 274.122 21.6236 282.619 32.1055 282.619C42.5873 282.619 51.0845 274.122 51.0845 263.64L51.0845 217.349C51.0845 206.867 42.5873 198.37 32.1055 198.37C21.6236 198.37 13.1264 206.867 13.1264 217.349L13.1264 263.64Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-16-pro-max-2024": {
    portrait: {
      left: 21, top: 18, width: 440, height: 956,
      paths: {
        portrait: "M0.00276963 77.9995C0.00276963 25.4998 28.203 0 74.203 0H361.703C416.203 0 440.203 27.9998 440.003 81.4994V875.494C440.003 927.994 414.703 955.993 362.203 955.993H79.203C23.703 956.493 -0.296878 928.494 0.00276963 874.494V77.9995ZM248.903 34.7C248.903 23.82 257.723 15 268.603 15C279.483 15 288.303 23.82 288.303 34.7C288.303 45.58 279.483 54.4 268.603 54.4C257.723 54.4 248.903 45.58 248.903 34.7ZM171.203 15C160.323 15 151.503 23.82 151.503 34.7C151.503 45.58 160.323 54.4 171.203 54.4H216.803C227.683 54.4 236.503 45.58 236.503 34.7C236.503 23.82 227.683 15 216.803 15H171.203Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 18, top: 21, width: 956, height: 440,
      paths: {
        landscape: "M78.0014 439.999C25.5018 439.999 0.00195189 411.799 0.00194988 365.799L0.00193731 78.299C0.00193493 23.799 28.0017 -0.201021 81.5014 -0.000827537L875.496 -0.000862244C927.996 -0.000864538 955.995 25.2989 955.995 77.7989L955.995 360.799C956.495 416.299 928.496 440.299 874.496 439.999L78.0014 439.999ZM34.7019 191.099C23.8219 191.099 15.0019 182.279 15.0019 171.399C15.0019 160.519 23.8219 151.699 34.7019 151.699C45.5819 151.699 54.4019 160.519 54.4019 171.399C54.4019 182.279 45.582 191.099 34.7019 191.099ZM15.0019 268.799C15.0019 279.679 23.8219 288.499 34.7019 288.499C45.582 288.499 54.4019 279.679 54.4019 268.799L54.4019 223.199C54.4019 212.319 45.582 203.499 34.7019 203.499C23.8219 203.499 15.0019 212.319 15.0019 223.199L15.0019 268.799Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-17-2025": {
    portrait: {
      left: 18, top: 15, width: 402, height: 874,
      paths: {
        portrait: "M328.153 0C350.085 5.26404e-05 368.797 3.60991 383.4 18.0469C398 32.4802 401.998 49.4111 402 73.833C402 73.8382 402.001 73.8434 402.001 73.8486L402.002 800.148C402.002 824.58 398.005 841.516 383.401 855.953C368.798 870.39 350.086 874 328.154 874H309.275V873.998H92.7266V874H73.8477C51.9155 874 33.2038 870.39 18.6006 855.953C3.99738 841.516 9.99415e-06 824.58 0 800.148V73.833C0.00203389 49.4112 4.00111 32.4802 18.6006 18.0469C32.7476 4.0609 50.7505 0.237046 71.8018 0.0117188L73.8486 0H328.153ZM156.478 14.8711C146.63 14.8711 138.646 22.8542 138.646 32.7021C138.646 42.5503 146.629 50.5342 156.478 50.5342H245.436C255.284 50.5341 263.267 42.5502 263.267 32.7021C263.266 22.8542 255.283 14.8712 245.436 14.8711H156.478Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 15, top: 18, width: 874, height: 402,
      paths: {
        landscape: "M-1.4344e-05 73.8486C3.73377e-05 51.9165 3.60989 33.2048 18.0469 18.6016C32.4802 4.00207 49.4111 0.00398486 73.833 0.0019499C73.8382 0.00194881 73.8434 0.000973348 73.8486 0.000973334L800.148 -3.49756e-05C824.58 -2.60494e-05 841.516 3.99734 855.953 18.6005C870.39 33.2038 874 51.9154 874 73.8476L874 92.7265L873.998 92.7265L873.998 309.275L874 309.275L874 328.154C874 350.086 870.39 368.798 855.953 383.401C841.516 398.005 824.58 402.002 800.148 402.002L73.833 402.002C49.4112 402 32.4802 398.001 18.0469 383.401C4.0609 369.254 0.237044 351.251 0.0117156 330.2L-3.22803e-06 328.153L-1.4344e-05 73.8486ZM14.8711 245.524C14.8711 255.372 22.8541 263.356 32.7021 263.356C42.5503 263.356 50.5342 255.373 50.5342 245.524L50.5342 156.566C50.5341 146.718 42.5502 138.735 32.7021 138.735C22.8542 138.735 14.8712 146.718 14.8711 156.566L14.8711 245.524Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-air-2025": {
    portrait: {
      left: 18, top: 15, width: 420, height: 912,
      paths: {
        portrait: "M339.479 0C364.679 1.35325e-05 385.245 1.73931 402.045 18.5527C418.845 35.3664 420.004 55.3693 420.004 80.5898V831.409C420.004 856.63 418.845 876.633 402.045 893.446C385.297 910.207 364.808 911.987 339.716 911.998C339.637 911.998 339.557 912 339.478 912H80.5244C80.444 912 80.3636 911.998 80.2832 911.998C55.1941 911.987 34.7069 910.206 17.9609 893.446C1.26899 876.741 0.017371 856.887 0.00195312 831.896C0.00123837 831.756 4.62832e-07 831.616 0 831.476V80.5244C2.90207e-07 80.384 0.00123521 80.2437 0.00195312 80.1035C0.017371 55.1119 1.26899 35.2582 17.9609 18.5527C34.7601 1.74018 55.3244 0.000193307 80.5225 0H339.479ZM165.859 20.7559C155.941 20.7559 147.901 28.8104 147.9 38.7285C147.9 48.6468 155.941 56.7021 165.859 56.7021H254.494C264.412 56.7021 272.453 48.6468 272.453 38.7285C272.453 28.8104 264.412 20.7559 254.494 20.7559H165.859Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 15, top: 18, width: 912, height: 420,
      paths: {
        landscape: "M0.00193829 80.5225C0.00195072 55.3226 1.74125 34.757 18.5547 17.957C35.3684 1.15695 55.3712 -0.00195236 80.5918 -0.00195665L831.411 -0.00198947C856.632 -0.00198738 876.635 1.15691 893.448 17.957C910.209 34.7044 911.989 55.1939 912 80.2861C912 80.3654 912.002 80.445 912.002 80.5244L912.002 339.477C912.002 339.558 912 339.638 912 339.719C911.989 364.808 910.208 385.295 893.448 402.041C876.743 418.733 856.889 419.985 831.897 420C831.758 420.001 831.618 420.002 831.478 420.002L80.5264 420.002C80.386 420.002 80.2457 420.001 80.1055 420C55.1139 419.985 35.2602 418.733 18.5547 402.041C1.74213 385.242 0.00214401 364.678 0.00194961 339.479L0.00193829 80.5225ZM20.7578 254.143C20.7578 264.061 28.8123 272.101 38.7305 272.102C48.6488 272.102 56.7041 264.061 56.7041 254.143L56.7041 165.508C56.7041 155.589 48.6488 147.549 38.7305 147.549C28.8123 147.549 20.7578 155.59 20.7578 165.508L20.7578 254.143Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-17-pro-2025": {
    portrait: {
      left: 19, top: 15, width: 402, height: 873,
      paths: {
        portrait: "M325.626 0.00195312C355.311 0.0461999 369.005 4.39275 382.819 18.0713C396.862 31.9756 402.002 47.6422 402.002 76.7354V197.398H401.999V675.602H402.002V796.265C402.002 825.358 397.14 841.302 383.098 855.206C369.272 868.895 353.087 872.963 325.527 872.998C325.441 872.998 325.355 873 325.269 873H76.7305C76.6616 873 76.5923 872.998 76.5234 872.998C48.9323 872.97 32.4858 869.182 18.6523 855.484C4.61009 841.58 6.59339e-05 825.358 0 796.265V76.7002C0.00367649 47.6289 4.61578 31.4144 18.6523 17.5156C32.4777 3.82618 48.9126 0.0337073 76.4746 0.000976562C76.5597 0.000699059 76.6453 0 76.7305 0H325.269C325.388 0 325.507 0.00141116 325.626 0.00195312ZM156.798 14.4551C146.971 14.4551 139.005 22.4226 139.005 32.249C139.005 42.0755 146.971 50.043 156.798 50.043H244.926C254.752 50.043 262.718 42.0755 262.718 32.249C262.718 22.4226 254.752 14.4551 244.926 14.4551H156.798Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 15, top: 19, width: 873, height: 402,
      paths: {
        landscape: "M0.00193889 76.376C0.0461843 46.6911 4.39273 32.997 18.0713 19.1826C31.9755 5.14044 47.6422 -2.08251e-06 76.7353 -3.35421e-06L197.398 -8.62856e-06L197.398 0.00292106L675.602 0.00290016L675.602 -2.95315e-05L796.265 -3.48058e-05C825.358 3.34527e-05 841.302 4.86203 855.206 18.9043C868.895 32.7295 872.963 48.9149 872.998 76.4746C872.998 76.5607 873 76.6472 873 76.7334L873 325.271C873 325.34 872.998 325.41 872.998 325.478C872.97 353.07 869.182 369.516 855.484 383.35C841.58 397.392 825.358 402.002 796.265 402.002L76.7002 402.002C47.6289 401.998 31.4144 397.386 17.5156 383.35C3.82618 369.524 0.0337051 353.089 0.00097322 325.527C0.000695713 325.442 -3.35027e-06 325.357 -3.354e-06 325.271L-1.42179e-05 76.7334C-1.42231e-05 76.6143 0.00139693 76.4949 0.00193889 76.376ZM14.4551 245.204C14.4551 255.031 22.4226 262.997 32.249 262.997C42.0755 262.997 50.043 255.031 50.043 245.204L50.043 157.076C50.043 147.25 42.0755 139.284 32.249 139.284C22.4225 139.284 14.4551 147.25 14.4551 157.076L14.4551 245.204Z",
      },
      enableRotation: true,
    },
  },
  "apple-iphone-17-pro-max-2025": {
    portrait: {
      left: 21, top: 17, width: 440, height: 956,
      paths: {
        portrait: "M356.305 0.000976562C388.867 0.0395027 403.871 4.79496 419.008 19.79C434.377 35.0162 440.004 52.1713 440.004 84.0303V216.166H440.001V739.834H440.004V871.969C440.004 903.828 434.682 921.288 419.312 936.514C404.273 951.413 386.681 955.902 356.852 955.994C356.574 955.997 356.296 956 356.018 956H83.9834C83.7553 956 83.5275 955.997 83.2998 955.995C53.3758 955.923 35.4805 951.742 20.416 936.818C5.04628 921.592 5.41729e-05 903.828 0 871.969V83.9492C0.00858399 52.1411 5.05946 34.3939 20.416 19.1807C35.5455 4.19262 53.5301 0.0383268 83.6875 0.000976562C83.7861 0.000636162 83.8847 3.40204e-07 83.9834 0H356.018C356.113 0 356.209 0.000656835 356.305 0.000976562ZM171.621 15.8311C160.866 15.8311 152.146 24.561 152.146 35.3164C152.147 46.0716 160.866 54.8018 171.621 54.8018H268.08C278.835 54.8018 287.554 46.0716 287.555 35.3164C287.555 24.561 278.836 15.8311 268.08 15.8311H171.621Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 17, top: 21, width: 956, height: 440,
      paths: {
        landscape: "M0.000960988 83.6992C0.0394857 51.1365 4.79495 36.1325 19.79 20.9961C35.0162 5.62654 52.1712 2.69873e-05 84.0303 -3.67308e-06L216.166 -9.44892e-06L216.166 0.00292024L739.834 0.00289735L739.834 -3.23392e-05L871.969 -3.8115e-05C903.828 1.76162e-05 921.288 5.32182 936.514 20.6914C951.413 35.7311 955.902 53.3225 955.994 83.1523C955.997 83.4299 956 83.7081 956 83.9863L956 356.02C956 356.249 955.997 356.476 955.995 356.704C955.923 386.628 951.742 404.523 936.818 419.588C921.592 434.958 903.828 440.004 871.969 440.004L83.9492 440.004C52.1411 439.995 34.3939 434.944 19.1807 419.588C4.19262 404.458 0.0383244 386.474 0.000972904 356.316C0.000632499 356.218 -3.32651e-06 356.119 -3.67103e-06 356.021L-1.5562e-05 83.9863C-1.55662e-05 83.8907 0.000641265 83.7948 0.000960988 83.6992ZM15.831 268.383C15.831 279.138 24.561 287.857 35.3164 287.857C46.0716 287.857 54.8018 279.138 54.8018 268.383L54.8017 171.924C54.8017 161.169 46.0716 152.449 35.3164 152.449C24.561 152.449 15.831 161.168 15.831 171.924L15.831 268.383Z",
      },
      enableRotation: true,
    },
  },
  "apple-macbook-pro-16-2021": {
    portrait: {
      left: 197, top: 65, width: 1728, height: 1085,
      paths: {
        portrait: "M0 0H1728V1085H0V0Z",
      },
      enableRotation: false,
    },
  },
  "samsung-galaxy-z-flip3-2021": {
    portrait: {
      left: 25, top: 24, width: 360, height: 880,
      paths: {
        portrait: "M25 0C11.1929 0 0 11.1929 0 25V855C0 868.807 11.1929 880 25 880H335C348.807 880 360 868.807 360 855V25C360 11.1929 348.807 0 335 0H25ZM180 28.5C185.799 28.5 190.5 23.799 190.5 18C190.5 12.201 185.799 7.5 180 7.5C174.201 7.5 169.5 12.201 169.5 18C169.5 23.799 174.201 28.5 180 28.5Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 24, top: 25, width: 880, height: 360,
      paths: {
        landscape: "M-1.09278e-06 335C-4.89256e-07 348.807 11.1929 360 25 360L855 360C868.807 360 880 348.807 880 335L880 25C880 11.1928 868.807 -3.79768e-05 855 -3.73732e-05L25 -1.09278e-06C11.1929 -4.89256e-07 -1.52468e-05 11.1929 -1.46433e-05 25L-1.09278e-06 335ZM28.5 180C28.5 174.201 23.799 169.5 18 169.5C12.201 169.5 7.49999 174.201 7.49999 180C7.49999 185.799 12.201 190.5 18 190.5C23.799 190.5 28.5 185.799 28.5 180Z",
      },
      enableRotation: true,
    },
  },
  "oppo-find-x3-pro": {
    portrait: {
      left: 10, top: 20, width: 360, height: 804,
      paths: {
        portrait: "M4.36782 17.5291C0.98576 23.1849 0 30.2926 0 37.3954V766.605C0 773.61 0.243658 778.992 4.36782 786.003C10.7904 796.923 23.3579 804 36.7816 804H323.218C335.252 804 346.623 798.125 353.333 789.042C359.032 781.329 360 775.023 360 766.605V37.3953C360 28.1682 358.391 19.8663 352.184 12.8547C345.437 4.77901 334.457 0 323.218 0H36.7816C23.4539 0 10.8198 6.73938 4.36782 17.5291ZM41.0328 30.6173C46.4287 30.6173 50.8029 26.17 50.8029 20.6841C50.8029 15.1982 46.4287 10.751 41.0328 10.751C35.6369 10.751 31.2627 15.1982 31.2627 20.6841C31.2627 26.17 35.6369 30.6173 41.0328 30.6173Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 20, top: 10, width: 804, height: 360,
      paths: {
        landscape: "M17.5291 355.632C23.1849 359.014 30.2926 360 37.3954 360L766.605 360C773.61 360 778.992 359.756 786.003 355.632C796.923 349.21 804 336.642 804 323.218L804 36.7816C804 24.748 798.125 13.3771 789.042 6.66662C781.329 0.968411 775.023 -3.38773e-05 766.605 -3.35094e-05L37.3953 -1.6346e-06C28.1682 -1.23127e-06 19.8663 1.60919 12.8546 7.8161C4.77899 14.5629 -1.46196e-05 25.5434 -1.41283e-05 36.7816L-1.60778e-06 323.218C-1.0252e-06 336.546 6.73938 349.18 17.5291 355.632ZM30.6173 318.967C30.6173 313.571 26.17 309.197 20.6841 309.197C15.1982 309.197 10.751 313.571 10.751 318.967C10.751 324.363 15.1982 328.737 20.6841 328.737C26.17 328.737 30.6173 324.363 30.6173 318.967Z",
      },
      enableRotation: true,
    },
  },
  "microsoft-surface-duo": {
    portrait: {
      left: 25, top: 91, width: 1114, height: 705,
      paths: {
        portrait: [
            "M0 0H540V705H0V0Z",
            "M574 0H1114V705H574V0Z"
          ],
      },
      enableRotation: false,
    },
  },
  "samsung-galaxy-a12-2021": {
    portrait: {
      left: 17, top: 20, width: 360, height: 800,
      paths: {
        portrait: "M34.8164 0C15.5878 0 0 15.5878 0 34.8164V765.184C0 784.412 15.5878 800 34.8164 800H325.184C344.412 800 360 784.412 360 765.184V34.8164C360 15.5878 344.412 0 325.184 0H221.8C213.8 0 209.3 2.30215 204.3 5.5C201.437 7.33113 199.047 9.9233 196.805 12.3537C196.024 13.2004 195.261 14.0282 194.502 14.7966C191.385 18.65 185.965 21.2 179.8 21.2C173.414 21.2 167.826 18.4632 164.771 14.3756C164.667 14.2532 164.562 14.1277 164.454 13.9996C162.489 11.6624 159.771 8.42962 156.3 6C152.3 3.2 147.008 0 138.008 0H34.8164Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 20, top: 17, width: 800, height: 360,
      paths: {
        landscape: "M-1.52187e-06 325.184C-6.81366e-07 344.412 15.5878 360 34.8164 360L765.184 360C784.412 360 800 344.412 800 325.184L800 34.8164C800 15.5878 784.412 -3.42877e-05 765.184 -3.34472e-05L34.8164 -1.52187e-06C15.5878 -6.81366e-07 -1.50547e-05 15.5878 -1.42142e-05 34.8164L-9.6952e-06 138.2C-9.34551e-06 146.2 2.30214 150.7 5.49999 155.7C7.33112 158.563 9.92329 160.953 12.3537 163.195C13.2004 163.976 14.0282 164.739 14.7965 165.498C18.65 168.615 21.2 174.035 21.2 180.2C21.2 186.586 18.4632 192.174 14.3756 195.229C14.2532 195.333 14.1277 195.438 13.9996 195.546C11.6624 197.511 8.42962 200.229 5.99999 203.7C3.19999 207.7 -6.42594e-06 212.992 -6.03253e-06 221.992L-1.52187e-06 325.184Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-s21-ultra": {
    portrait: {
      left: 10, top: 12, width: 360, height: 800,
      paths: {
        portrait: "M30 0C13.4315 0 0 13.4315 0 30V770C0 786.569 13.4314 800 30 800H330C346.569 800 360 786.569 360 770V30C360 13.4315 346.569 0 330 0H30ZM179.6 25C184.626 25 188.7 20.9258 188.7 15.9C188.7 10.8743 184.626 6.80005 179.6 6.80005C174.574 6.80005 170.5 10.8743 170.5 15.9C170.5 20.9258 174.574 25 179.6 25Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 12, top: 10, width: 800, height: 360,
      paths: {
        landscape: "M-1.31134e-06 330C-5.87108e-07 346.569 13.4315 360 30 360L770 360C786.569 360 800 346.569 800 330L800 30C800 13.4314 786.569 -3.4382e-05 770 -3.36578e-05L30 -1.31134e-06C13.4314 -5.87108e-07 -1.5149e-05 13.4315 -1.44248e-05 30L-1.31134e-06 330ZM25 180.4C25 175.374 20.9258 171.3 15.9 171.3C10.8742 171.3 6.80004 175.374 6.80004 180.4C6.80004 185.426 10.8743 189.5 15.9 189.5C20.9258 189.5 25 185.426 25 180.4Z",
      },
      enableRotation: true,
    },
  },
  "google-pixel-6-pro": {
    portrait: {
      left: 10, top: 18, width: 360, height: 780,
      paths: {
        portrait: "M15 0C6.71573 0 0 6.71574 0 15V765C0 773.284 6.71574 780 15 780H345C353.284 780 360 773.284 360 765V15C360 6.71573 353.284 0 345 0H15ZM179.9 27.8999C185.423 27.8999 189.9 23.4228 189.9 17.8999C189.9 12.3771 185.423 7.8999 179.9 7.8999C174.377 7.8999 169.9 12.3771 169.9 17.8999C169.9 23.4228 174.377 27.8999 179.9 27.8999Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 18, top: 10, width: 780, height: 360,
      paths: {
        landscape: "M-6.55671e-07 345C-2.93554e-07 353.284 6.71574 360 15 360L765 360C773.284 360 780 353.284 780 345L780 15C780 6.71569 773.284 -3.38013e-05 765 -3.34392e-05L15 -6.55671e-07C6.71571 -2.93554e-07 -1.54425e-05 6.71573 -1.50804e-05 15L-6.55671e-07 345ZM27.8999 180.1C27.8999 174.577 23.4227 170.1 17.8999 170.1C12.377 170.1 7.89989 174.577 7.89989 180.1C7.89989 185.623 12.377 190.1 17.8999 190.1C23.4227 190.1 27.8999 185.623 27.8999 180.1Z",
      },
      enableRotation: true,
    },
  },
  "xiaomi-12-2022": {
    portrait: {
      left: 11, top: 15, width: 360, height: 800,
      paths: {
        portrait: "M41 0C18.3563 0 0 18.3563 0 41V759C0 781.644 18.3563 800 41 800H319C341.644 800 360 781.644 360 759V41C360 18.3563 341.644 0 319 0H41ZM179.95 27.6999C185.003 27.6999 189.1 23.6033 189.1 18.5499C189.1 13.4965 185.003 9.3999 179.95 9.3999C174.896 9.3999 170.8 13.4965 170.8 18.5499C170.8 23.6033 174.896 27.6999 179.95 27.6999Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 15, top: 11, width: 800, height: 360,
      paths: {
        landscape: "M-1.79217e-06 319C-8.02381e-07 341.644 18.3563 360 41 360L759 360C781.644 360 800 341.644 800 319L800 41C800 18.3563 781.644 -3.41667e-05 759 -3.31769e-05L41 -1.79217e-06C18.3563 -8.0238e-07 -1.49337e-05 18.3563 -1.39439e-05 41L-1.79217e-06 319ZM27.6999 180.05C27.6999 174.997 23.6033 170.9 18.5499 170.9C13.4965 170.9 9.39989 174.997 9.39989 180.05C9.39989 185.104 13.4965 189.2 18.5499 189.2C23.6033 189.2 27.6999 185.104 27.6999 180.05Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-note20-ultra": {
    portrait: {
      left: 4, top: 11, width: 412, height: 883,
      paths: {
        portrait: "M13 0C5.8203 0 0 5.82029 0 13V870C0 877.18 5.82029 883 13 883H399C406.18 883 412 877.18 412 870V13C412 5.8203 406.18 0 399 0H13ZM206.1 27.4C211.126 27.4 215.2 23.3258 215.2 18.3C215.2 13.2742 211.126 9.2 206.1 9.2C201.074 9.2 197 13.2742 197 18.3C197 23.3258 201.074 27.4 206.1 27.4Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 11, top: 4, width: 883, height: 412,
      paths: {
        landscape: "M0.499999 399.5C0.5 406.68 6.32029 412.5 13.5 412.5L870.5 412.5C877.68 412.5 883.5 406.68 883.5 399.5L883.5 13.5C883.5 6.32027 877.68 0.499962 870.5 0.499962L13.5 0.499999C6.32028 0.5 0.499982 6.32028 0.499983 13.5L0.499999 399.5ZM27.9 206.4C27.9 201.374 23.8258 197.3 18.8 197.3C13.7742 197.3 9.69999 201.374 9.69999 206.4C9.69999 211.426 13.7742 215.5 18.8 215.5C23.8258 215.5 27.9 211.426 27.9 206.4Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-s22-2022": {
    portrait: {
      left: 16, top: 16, width: 360, height: 780,
      paths: {
        portrait: "M9.5 11.1001C2.68318 18.2734 0 25.1001 0 40V740C0 753.6 2.8883 761.879 10 769.1C17.255 776.466 28.8442 780 40 780H320C330.652 780 341.332 776.389 348.5 769.6C356.198 762.31 360 751.439 360 740V40C360 28.5607 356.198 17.3905 348.5 10.1001C341.332 3.31136 333 0 320 0H40C23.5 0 16.7877 3.43127 9.5 11.1001ZM179.6 23.9001C184.129 23.9001 187.8 20.2288 187.8 15.7001C187.8 11.1714 184.129 7.5001 179.6 7.5001C175.071 7.5001 171.4 11.1714 171.4 15.7001C171.4 20.2288 175.071 23.9001 179.6 23.9001Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 16, top: 16, width: 780, height: 360,
      paths: {
        landscape: "M11.1001 350.5C18.2734 357.317 25.1001 360 40 360L740 360C753.6 360 761.879 357.112 769.1 350C776.466 342.745 780 331.156 780 320L780 40C780 29.3479 776.389 18.6683 769.6 11.5C762.31 3.80188 751.439 -3.28465e-05 740 -3.23464e-05L40 -1.74846e-06C28.5607 -1.24843e-06 17.3905 3.80191 10.1001 11.5C3.31134 18.6683 -1.45559e-05 27 -1.39876e-05 40L-1.74846e-06 320C-1.02722e-06 336.5 3.43127 343.212 11.1001 350.5ZM23.9001 180.4C23.9001 175.871 20.2288 172.2 15.7001 172.2C11.1714 172.2 7.50009 175.871 7.50009 180.4C7.50009 184.929 11.1714 188.6 15.7001 188.6C20.2288 188.6 23.9001 184.929 23.9001 180.4Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-s22-plus-2022": {
    portrait: {
      left: 16, top: 16, width: 360, height: 780,
      paths: {
        portrait: "M9.5 11.1001C2.68318 18.2734 0 25.1001 0 40V740C0 753.6 2.8883 761.879 10 769.1C17.255 776.466 28.8442 780 40 780H320C330.652 780 341.332 776.389 348.5 769.6C356.198 762.31 360 751.439 360 740V40C360 28.5607 356.198 17.3905 348.5 10.1001C341.332 3.31136 333 0 320 0H40C23.5 0 16.7877 3.43127 9.5 11.1001ZM179.6 23.9001C184.129 23.9001 187.8 20.2288 187.8 15.7001C187.8 11.1714 184.129 7.5001 179.6 7.5001C175.071 7.5001 171.4 11.1714 171.4 15.7001C171.4 20.2288 175.071 23.9001 179.6 23.9001Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 16, top: 16, width: 780, height: 360,
      paths: {
        landscape: "M11.1001 350.5C18.2734 357.317 25.1001 360 40 360L740 360C753.6 360 761.879 357.112 769.1 350C776.466 342.745 780 331.156 780 320L780 40C780 29.3479 776.389 18.6683 769.6 11.5C762.31 3.80188 751.439 -3.28465e-05 740 -3.23464e-05L40 -1.74846e-06C28.5607 -1.24843e-06 17.3905 3.80191 10.1001 11.5C3.31134 18.6683 -1.45559e-05 27 -1.39876e-05 40L-1.74846e-06 320C-1.02722e-06 336.5 3.43127 343.212 11.1001 350.5ZM23.9001 180.4C23.9001 175.871 20.2288 172.2 15.7001 172.2C11.1714 172.2 7.50009 175.871 7.50009 180.4C7.50009 184.929 11.1714 188.6 15.7001 188.6C20.2288 188.6 23.9001 184.929 23.9001 180.4Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-s22-ultra-2022": {
    portrait: {
      left: 4, top: 5, width: 360, height: 772,
      paths: {
        portrait: "M7.52427 0C3.36873 0 0 3.36875 0 7.52429V764.476C0 768.631 3.36872 772 7.52426 772H352.476C356.631 772 360 768.631 360 764.476V7.52427C360 3.36873 356.631 0 352.476 0H7.52427ZM180.25 30.5C184.806 30.5 188.5 26.8063 188.5 22.25C188.5 17.6937 184.806 14 180.25 14C175.694 14 172 17.6937 172 22.25C172 26.8063 175.694 30.5 180.25 30.5Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 5, top: 4, width: 772, height: 360,
      paths: {
        landscape: "M-3.28896e-07 352.476C-1.47252e-07 356.631 3.36875 360 7.52429 360L764.476 360C768.631 360 772 356.631 772 352.476L772 7.52423C772 3.36871 768.631 -3.35979e-05 764.476 -3.34163e-05L7.52426 -3.28896e-07C3.36871 -1.47252e-07 -1.55888e-05 3.36871 -1.54072e-05 7.52426L-3.28896e-07 352.476ZM30.5 179.75C30.5 175.194 26.8063 171.5 22.25 171.5C17.6936 171.5 14 175.194 14 179.75C14 184.306 17.6936 188 22.25 188C26.8063 188 30.5 184.306 30.5 179.75Z",
      },
      enableRotation: true,
    },
  },
  "google-pixel-8-2024": {
    portrait: {
      left: 20, top: 20, width: 412, height: 916,
      paths: {
        portrait: "M36 0C16.1178 0 0 16.1178 0 36V880C0 899.882 16.1177 916 36 916H376C395.882 916 412 899.882 412 880V36C412 16.1178 395.882 0 376 0H36ZM205.55 37.2998C212.729 37.2998 218.55 31.4795 218.55 24.2998C218.55 17.1201 212.729 11.2998 205.55 11.2998C198.37 11.2998 192.55 17.1201 192.55 24.2998C192.55 31.4795 198.37 37.2998 205.55 37.2998Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 20, top: 20, width: 916, height: 412,
      paths: {
        landscape: "M-1.57361e-06 376C-7.04529e-07 395.882 16.1178 412 36 412L880 412C899.882 412 916 395.882 916 376L916 36C916 16.1177 899.882 -3.93351e-05 880 -3.8466e-05L36 -1.57361e-06C16.1177 -7.04529e-07 -1.73046e-05 16.1177 -1.64355e-05 36L-1.57361e-06 376ZM37.2998 206.45C37.2998 199.271 31.4795 193.45 24.2998 193.45C17.1201 193.45 11.2998 199.271 11.2998 206.45C11.2998 213.63 17.1201 219.45 24.2998 219.45C31.4795 219.45 37.2998 213.63 37.2998 206.45Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-s24-2024": {
    portrait: {
      left: 14, top: 14, width: 360, height: 780,
      paths: {
        portrait: "M10.5 9.5C3.41579 16.2402 0 26.4496 0 37V743C0 753.135 3.39955 762.818 10 769.5C16.7081 776.291 26.7001 780 37 780H323C334.511 780 345.214 775.744 352 767.5C357.261 761.109 360 751.924 360 743V37C360 26.6102 356.396 16.2206 349.5 9.5C342.833 3.00266 333.045 0 323 0H37C27.1158 0 17.1369 3.18536 10.5 9.5ZM180.05 27.3501C185.02 27.3501 189.05 23.3207 189.05 18.3501C189.05 13.3795 185.02 9.3501 180.05 9.3501C175.079 9.3501 171.05 13.3795 171.05 18.3501C171.05 23.3207 175.079 27.3501 180.05 27.3501Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 14, top: 14, width: 780, height: 360,
      paths: {
        landscape: "M9.5 349.5C16.2402 356.584 26.4496 360 37 360L743 360C753.135 360 762.818 356.6 769.5 350C776.291 343.292 780 333.3 780 323L780 37C780 25.489 775.744 14.786 767.5 7.99997C761.109 2.73922 751.924 -3.28676e-05 743 -3.24776e-05L37 -1.61732e-06C26.6102 -1.16317e-06 16.2206 3.60397 9.49998 10.5C3.00265 17.167 -1.45578e-05 26.9553 -1.41188e-05 37L-1.61732e-06 323C-1.18527e-06 332.884 3.18536 342.863 9.5 349.5ZM27.3501 179.95C27.3501 174.98 23.3207 170.95 18.3501 170.95C13.3795 170.95 9.35009 174.98 9.35009 179.95C9.35009 184.921 13.3795 188.95 18.3501 188.95C23.3207 188.95 27.3501 184.921 27.3501 179.95Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-s24-ultra-2024": {
    portrait: {
      left: 18, top: 15, width: 384, height: 832,
      paths: {
        portrait: "M2 0C0.895431 0 0 0.895438 0 2.00001V830C0 831.105 0.895423 832 1.99999 832H382C383.105 832 384 831.105 384 830V2C384 0.895431 383.105 0 382 0H2ZM191.9 26.2002C196.594 26.2002 200.4 22.3946 200.4 17.7002C200.4 13.0058 196.594 9.2002 191.9 9.2002C187.205 9.2002 183.4 13.0058 183.4 17.7002C183.4 22.3946 187.205 26.2002 191.9 26.2002Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 15, top: 18, width: 832, height: 384,
      paths: {
        landscape: "M-8.74228e-08 382C-3.91405e-08 383.105 0.895438 384 2.00001 384L830 384C831.105 384 832 383.105 832 382L832 1.99996C832 0.89538 831.105 -3.63287e-05 830 -3.62805e-05L1.99998 -8.74228e-08C0.895414 -3.91405e-08 -1.6746e-05 0.895416 -1.66978e-05 2L-8.74228e-08 382ZM26.2002 192.1C26.2002 187.406 22.3946 183.6 17.7002 183.6C13.0058 183.6 9.20019 187.406 9.20019 192.1C9.20019 196.795 13.0058 200.6 17.7002 200.6C22.3946 200.6 26.2002 196.795 26.2002 192.1Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-s26-ultra-2026": {
    portrait: {
      left: 13, top: 12, width: 412, height: 891,
      paths: {
        portrait: "M382.064 0C398.597 0 412 13.4027 412 29.9355V861.064C412 877.597 398.598 891 382.065 891H29.9355C13.4027 891 0 877.597 0 861.064V29.9355C0 13.4027 13.4027 0 29.9355 0H382.064ZM206 12.2139C200.092 12.2139 195.303 17.1351 195.303 23.2061C195.303 29.277 200.092 34.1982 206 34.1982C211.908 34.1982 216.697 29.277 216.697 23.2061C216.697 17.1351 211.908 12.2139 206 12.2139Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 12, top: 13, width: 891, height: 412,
      paths: {
        landscape: "M-1.67006e-05 29.9355C-1.74232e-05 13.4027 13.4027 -5.85851e-07 29.9355 -1.30852e-06L861.064 -3.76383e-05C877.597 -3.8361e-05 891 13.4019 891 29.9345L891 382.064C891 398.597 877.597 412 861.064 412L29.9355 412C13.4027 412 -5.85851e-07 398.597 -1.30852e-06 382.064L-1.67006e-05 29.9355ZM12.2139 206C12.2139 211.908 17.1351 216.697 23.206 216.697C29.277 216.697 34.1982 211.908 34.1982 206C34.1982 200.092 29.277 195.303 23.206 195.303C17.1351 195.303 12.2139 200.092 12.2139 206Z",
      },
      enableRotation: true,
    },
  },
  "apple-imac-24-inch-2021": {
    portrait: {
      left: 54, top: 54, width: 2048, height: 1152,
      paths: {
        portrait: "M0 0H2048V1152H0V0Z",
      },
      enableRotation: false,
    },
  },
  "samsung-smart-tv": {
    portrait: {
      left: 11, top: 12, width: 1920, height: 1080,
      paths: {
        portrait: "M2.49563 2.49302C2.49818 1.39047 3.39254 0.497892 4.4951 0.497605L1915.01 0.00048835C1916.11 0.000201452 1917 0.892333 1917.01 1.99493L1919.99 1077.99C1920 1079.1 1919.1 1080 1917.99 1080H2.00491C0.898529 1080 0.00232606 1079.1 0.00488829 1078L2.49563 2.49302Z",
      },
      enableRotation: false,
    },
  },
  "self-service-kiosk": {
    portrait: {
      left: 146, top: 150, width: 1080, height: 1920,
      paths: {
        portrait: "M0 1.99997C0 0.8954 0.895431 0 2 0H1078C1079.1 0 1080 0.895431 1080 2V1918C1080 1919.1 1079.1 1920 1078 1920H2.00001C0.895436 1920 0 1919.1 0 1918V1.99997Z",
      },
      enableRotation: false,
    },
  },
  "zebra-mc330": {
    portrait: {
      left: 94, top: 221, width: 480, height: 800,
      paths: {
        portrait: "M0 0H480V800H0V0Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 221, top: 94, width: 800, height: 480,
      paths: {
        landscape: "M-66 480L-66 0L734 -3.49691e-05L734 480L-66 480Z",
      },
      enableRotation: true,
    },
  },
  "zebra-tc78": {
    portrait: {
      left: 49, top: 128, width: 412, height: 818,
      paths: {
        portrait: "M0 2.99999C0 1.34314 1.34315 0 3 0H409C410.657 0 412 1.34315 412 3V815C412 816.657 410.657 818 409 818H3C1.34314 818 0 816.657 0 815V2.99999Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 128, top: 49, width: 818, height: 412,
      paths: {
        landscape: "M2.99999 412C1.34314 412 -5.87108e-08 410.657 -1.31134e-07 409L-1.7878e-05 3C-1.79504e-05 1.34315 1.34313 -5.87108e-08 2.99998 -1.31134e-07L815 -3.56248e-05C816.657 -3.56972e-05 818 1.34311 818 2.99996L818 409C818 410.657 816.657 412 815 412L2.99999 412Z",
      },
      enableRotation: true,
    },
  },
  "google-pixel-10-2026": {
    portrait: {
      left: 22, top: 23, width: 412, height: 924,
      paths: {
        portrait: "M353 0C385.585 0 412 26.4152 412 59L412 865C412 897.585 385.585 924 353 924L59 924C26.4152 924 0 897.585 0 865L0 59C0 26.4152 26.4152 0 59 0L353 0ZM206.055 17.9697C197.684 17.9697 190.898 24.7554 190.898 33.126C190.899 41.4963 197.684 48.2822 206.055 48.2822C214.425 48.282 221.211 41.4962 221.211 33.126C221.211 24.7556 214.425 17.97 206.055 17.9697Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 23, top: 22, width: 924, height: 412,
      paths: {
        landscape: "M0 59C0 26.415 26.4152 0 59 0L865 0C897.585 0 924 26.415 924 59L924 353C924 385.5848 897.585 412 865 412L59 412C26.4152 412 0 385.5848 0 353L0 59ZM17.9697 205.945C17.9697 214.316 24.7554 221.102 33.126 221.102C41.4963 221.101 48.2822 214.316 48.2822 205.945C48.282 197.575 41.4962 190.789 33.126 190.789C24.7556 190.789 17.97 197.575 17.9697 205.945Z",
      },
      enableRotation: true,
    },
  },
  "google-pixel-10-pro-2026": {
    portrait: {
      left: 18, top: 17, width: 410, height: 912,
      paths: {
        portrait: "M356 0C385.823 0 410 24.1766 410 54L410 858C410 887.823 385.823 912 356 912L54 912C24.1766 912 0 887.823 0 858L0 54C0 24.1766 24.1766 0 54 0L356 0ZM205.25 17.4004C197.656 17.4004 191.5 23.5565 191.5 31.1504C191.5 38.7441 197.656 44.9004 205.25 44.9004C212.844 44.9004 219 38.7441 219 31.1504C219 23.5565 212.844 17.4004 205.25 17.4004Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 17, top: 18, width: 912, height: 410,
      paths: {
        landscape: "M0 54C0 24.177 24.1766 0 54 0L858 0C887.823 0 912 24.177 912 54L912 356C912 385.8234 887.823 410 858 410L54 410C24.1766 410 0 385.8234 0 356L0 54ZM17.4004 204.75C17.4004 212.344 23.5565 218.5 31.1504 218.5C38.7441 218.5 44.9004 212.344 44.9004 204.75C44.9004 197.156 38.7441 191 31.1504 191C23.5565 191 17.4004 197.156 17.4004 204.75Z",
      },
      enableRotation: true,
    },
  },
  "google-pixel-10-pro-fold-2026": {
    portrait: {
      left: 31, top: 25, width: 412, height: 901,
      paths: {
        portrait: "M355 0C386.48 0 412 25.5198 412 57L412 844C412 875.48 386.48 901 355 901L57 901C25.5198 901 0 875.48 0 844L0 57C0 25.5198 25.5198 0 57 0L355 0ZM205.101 17.2002C198.197 17.2002 192.601 22.7966 192.601 29.7002C192.601 36.6038 198.197 42.2002 205.101 42.2002C212.004 42.1999 217.601 36.6036 217.601 29.7002C217.601 22.7968 212.004 17.2005 205.101 17.2002Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 25, top: 31, width: 901, height: 412,
      paths: {
        landscape: "M0 57C0 25.52 25.5198 0 57 0L844 0C875.48 0 901 25.52 901 57L901 355C901 386.4802 875.48 412 844 412L57 412C25.5198 412 0 386.4802 0 355L0 57ZM17.2002 206.899C17.2002 213.803 22.7966 219.399 29.7002 219.399C36.6038 219.399 42.2002 213.803 42.2002 206.899C42.1999 199.996 36.6036 194.399 29.7002 194.399C22.7968 194.399 17.2005 199.996 17.2002 206.899Z",
      },
      enableRotation: true,
    },
  },
  "samsung-galaxy-a17-2025": {
    portrait: {
      left: 21, top: 22, width: 412, height: 892,
      paths: {
        portrait: "M371 0C393.644 0 412 18.3563 412 41V851C412 873.644 393.644 892 371 892H41C18.3563 892 0 873.644 0 851V41C0 18.3563 18.3563 7.24793e-07 41 0H172.7C174.512 9.41244e-05 178.686 1.39792 181.466 6.03418C182.904 8.43358 183.324 11.7004 184.214 16.0898C185.068 20.074 186.785 24.1112 189.716 27.6553C193.817 32.6137 200.043 35.7002 205.7 35.7002C211.357 35.7001 217.584 32.6137 221.685 27.6553C224.615 24.1112 226.332 20.074 227.187 16.0898C228.077 11.7003 228.496 8.43359 229.935 6.03418C232.715 1.39776 236.888 0 238.7 0H371Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 22, top: 21, width: 892, height: 412,
      paths: {
        landscape: "M0 41C0 18.356 18.3563 0 41 0L851 0C873.644 0 892 18.356 892 41L892 371C892 393.6437 873.644 412 851 412L41 412C18.3563 412 0 393.6437 0 371L0 239.3C0.0001 237.488 1.3979 233.314 6.0342 230.534C8.4336 229.096 11.7004 228.676 16.0898 227.786C20.074 226.932 24.1112 225.215 27.6553 222.284C32.6137 218.183 35.7002 211.957 35.7002 206.3C35.7001 200.643 32.6137 194.416 27.6553 190.315C24.1112 187.385 20.074 185.668 16.0898 184.813C11.7003 183.923 8.4336 183.504 6.0342 182.065C1.3978 179.285 0 175.112 0 173.3L0 41Z",
      },
      enableRotation: true,
    },
  },
  "motorola-razr-70-ultra-2026": {
    portrait: {
      left: 28, top: 28, width: 412, height: 1008,
      paths: {
        portrait: "M375.108 0C395.483 0.0002 412 16.5169 412 36.8916L412 971.107C412 991.48 395.483 1008 375.108 1008L36.8926 1008C16.5176 1008 0 991.48 0 971.107L0 36.8916C0.0002 16.5168 16.5177 0 36.8926 0L375.108 0ZM206 8.25C198.406 8.2501 192.25 14.4062 192.25 22C192.25 29.5938 198.406 35.7499 206 35.75C213.594 35.75 219.75 29.5938 219.75 22C219.75 14.4061 213.594 8.25 206 8.25Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 28, top: 28, width: 1008, height: 412,
      paths: {
        landscape: "M0 36.892C0.0002 16.517 16.5169 0 36.8916 0L971.107 0C991.48 0 1008 16.517 1008 36.892L1008 375.1074C1008 395.4824 991.48 412 971.107 412L36.8916 412C16.5168 411.9998 0 395.4823 0 375.1074L0 36.892ZM8.25 206C8.2501 213.594 14.4062 219.75 22 219.75C29.5938 219.75 35.7499 213.594 35.75 206C35.75 198.406 29.5938 192.25 22 192.25C14.4061 192.25 8.25 198.406 8.25 206Z",
      },
      enableRotation: true,
    },
  },
  "infinix-hot-70-2026": {
    portrait: {
      left: 18, top: 22, width: 360, height: 788,
      paths: {
        portrait: "M318.898 0C341.598 0 360 18.4018 360 41.1016L360 746.898C360 769.598 341.598 788 318.898 788L41.1016 788C18.4018 788 0 769.598 0 746.898L0 41.1016C0 18.4018 18.4018 0 41.1016 0L318.898 0ZM180 10C173.925 10 169 14.9249 169 21C169 27.0751 173.925 32 180 32C186.075 32 191 27.0751 191 21C191 14.9249 186.075 10 180 10Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 22, top: 18, width: 788, height: 360,
      paths: {
        landscape: "M0 41.102C0 18.402 18.4018 0 41.1016 0L746.898 0C769.598 0 788 18.402 788 41.102L788 318.8984C788 341.5982 769.598 360 746.898 360L41.1016 360C18.4018 360 0 341.5982 0 318.8984L0 41.102ZM10 180C10 186.075 14.9249 191 21 191C27.0751 191 32 186.075 32 180C32 173.925 27.0751 169 21 169C14.9249 169 10 173.925 10 180Z",
      },
      enableRotation: true,
    },
  },
  "sonoff-nspanel-pro": {
    portrait: {
      left: 42, top: 45, width: 480, height: 480,
      paths: {
        portrait: "M0 0H480V480H0V0Z",
      },
      enableRotation: false,
    },
  },
  "non-branded-android-smartphone": {
    portrait: {
      left: 17, top: 18, width: 360, height: 800,
      paths: {
        portrait: "M0 30C0 13.4315 13.4315 0 30 0H330C346.569 0 360 13.4315 360 30V770C360 786.569 346.569 800 330 800H30C13.4314 800 0 786.569 0 770V30Z",
      },
      enableRotation: true,
    },
    landscape: {
      left: 18, top: 17, width: 800, height: 360,
      paths: {
        landscape: "M30 360C13.4315 360 1.38377e-05 346.569 1.31134e-05 330L0 30C-7.24234e-07 13.4315 13.4315 3.30707e-05 30 3.23464e-05L770 0C786.569 -7.24234e-07 800 13.4315 800 30V330C800 346.569 786.569 360 770 360L30 360Z",
      },
      enableRotation: true,
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

export function resolveMockupId(deviceId: string): string {
  return aliases[deviceId] ?? deviceId;
}

export function getMockupAssets(deviceId: string): MockupAsset[] {
  const lookupId = resolveMockupId(deviceId);
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

// Auto-derived from device reference data. Drives OS chrome (status bar, browser bar, safe areas).
export interface DeviceChromeMeta {
  osName: string;
  osVersion: string;
  /** true = physical notch baked into PNG; false = Dynamic Island / hole-punch / none */
  notch: boolean;
  /** iOS 26+ (Liquid Glass) devices report a bottom safe-area inset in px */
  safeAreaInsetBottom?: number;
  /**
   * Top safe-area inset (CSS px) derived from the mockup's baked camera cutout.
   * Content must start below this so it never renders under the hole-punch / notch.
   * Present for Android devices (measured per-device); iOS uses generation constants.
   */
  safeAreaInsetTop?: number;
  devicePixelRatio?: number;
  isPro?: boolean;
}

export function getDeviceChromeMeta(deviceId: string): DeviceChromeMeta | undefined {
  return deviceChromeMeta[resolveMockupId(deviceId)];
}

export const deviceChromeMeta: Record<string, DeviceChromeMeta> = {
  "apple-watch-serie-6": { osName: "watchOS", osVersion: "7.0", notch: false, devicePixelRatio: 2 },
  "samsung-galaxy-s20": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 36 },
  "xiaomi-mi-11i": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 33 },
  "huawei-p30-pro": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 28 },
  "google-pixel-5": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 49 },
  "oneplus-nord-2": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, isPro: false, safeAreaInsetTop: 50 },
  "samsung-galaxy-fold2": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, isPro: false, safeAreaInsetTop: 28 },
  "apple-iphone-5": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-iphone-se": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-iphone-x": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-xr": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-ipad-mini": { osName: "iPadOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-ipad-air-4": { osName: "iPadOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-ipad-pro-11-2018": { osName: "iPadOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "samsung-galaxy-tab-s7": { osName: "Android", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false, safeAreaInsetTop: 28 },
  "macbook-air": { osName: "macOS", osVersion: "11.0", notch: false, devicePixelRatio: 2, isPro: false },
  "dell-latitude-14-3420": { osName: "Windows", osVersion: "11.0", notch: false, devicePixelRatio: 1, isPro: true },
  "apple-iphone-11": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-iphone-11-pro": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-11-pro-max": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-12-mini": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-12": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-12-pro": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-12-pro-max": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-13-mini-2021": { osName: "iOS", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-13-2021": { osName: "iOS", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-13-pro-2021": { osName: "iOS", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-13-pro-max-2021": { osName: "iOS", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-14-2022": { osName: "iOS", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-14-max-2022": { osName: "iOS", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-14-pro-2022": { osName: "iOS", osVersion: "16.0", notch: true, devicePixelRatio: 3, isPro: false },
  "apple-iphone-14-pro-max-2022": { osName: "iOS", osVersion: "16.0", notch: true, devicePixelRatio: 3, isPro: false },
  "apple-iphone-15-2023": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-15-plus-2023": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-15-pro-2023": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-15-pro-max-2023": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-16-2024": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-16-plus-2024": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-16-pro-max-2024": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-17-2025": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-air-2025": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-17-pro-2025": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-17-pro-max-2025": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-macbook-pro-16-2021": { osName: "macOS", osVersion: "15.3", notch: false, devicePixelRatio: 2, isPro: true },
  "samsung-galaxy-z-flip3-2021": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 36 },
  "oppo-find-x3-pro": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 4, isPro: false, safeAreaInsetTop: 39 },
  "microsoft-surface-duo": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, isPro: false, safeAreaInsetTop: 28 },
  "samsung-galaxy-a12-2021": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, safeAreaInsetTop: 28 },
  "samsung-galaxy-s21-ultra": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 4, safeAreaInsetTop: 33 },
  "google-pixel-6-pro": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 4, safeAreaInsetTop: 36 },
  "xiaomi-12-2022": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, safeAreaInsetTop: 36 },
  "samsung-galaxy-note20-ultra": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 35 },
  "samsung-galaxy-s22-2022": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 32 },
  "samsung-galaxy-s22-plus-2022": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 32 },
  "samsung-galaxy-s22-ultra-2022": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 4, isPro: true, safeAreaInsetTop: 38 },
  "google-pixel-8-2024": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, isPro: true, safeAreaInsetTop: 45 },
  "samsung-galaxy-s24-2024": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 35 },
  "samsung-galaxy-s24-ultra-2024": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, isPro: true, safeAreaInsetTop: 34 },
  "samsung-galaxy-s26-ultra-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 4, isPro: true, safeAreaInsetTop: 42 },
  "google-pixel-10-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2.625, safeAreaInsetTop: 36 },
  "google-pixel-10-pro-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3.125, isPro: true, safeAreaInsetTop: 36 },
  "google-pixel-10-pro-fold-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2.625, isPro: true, safeAreaInsetTop: 36 },
  "samsung-galaxy-a17-2025": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2.625, safeAreaInsetTop: 36 },
  "motorola-razr-70-ultra-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 36 },
  "infinix-hot-70-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, safeAreaInsetTop: 36 },
  "apple-imac-24-inch-2021": { osName: "macOS", osVersion: "15.3", notch: false, devicePixelRatio: 2, isPro: true },
  "samsung-smart-tv": { osName: "Android", osVersion: "12.0", notch: false, devicePixelRatio: 1, isPro: true, safeAreaInsetTop: 28 },
  "self-service-kiosk": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 1, isPro: true, safeAreaInsetTop: 28 },
  "zebra-mc330": { osName: "Android", osVersion: "10.0", notch: false, devicePixelRatio: 1, isPro: true, safeAreaInsetTop: 28 },
  "zebra-tc78": { osName: "Android", osVersion: "13.0", notch: false, devicePixelRatio: 2, isPro: true, safeAreaInsetTop: 28 },
  "sonoff-nspanel-pro": { osName: "Android", osVersion: "8.1.0", notch: false, devicePixelRatio: 1, isPro: true, safeAreaInsetTop: 28 },
  "non-branded-android-smartphone": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 28 },
};
