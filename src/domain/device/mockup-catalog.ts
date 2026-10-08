import type { MockupAsset, MockupFrameStyle, MockupViewportConfig, Orientation, Size } from "./device.types";

interface LocalMockupAsset {
  id: string;
  localPath: string;
  file: string;
  bytes: number;
  width: number;
  height: number;
  renderScale?: number;
  previewScale?: number;
  frameOverlay?: boolean;
  sourceCrop?: MockupAsset["sourceCrop"];
  screenInset?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  viewport?: Partial<Record<Orientation, MockupViewportConfig>>;
  viewportSourceId?: string;
  cssViewport?: Size;
  frameStyle?: MockupFrameStyle;
}

// Mobile FIRST PNGs remain unmodified. Insets, aperture masks, and camera bounds
// are measured from their alpha channel; CSS viewports stay independent.
export const localMockupCatalog: LocalMockupAsset[] = [
{
  "id": "apple-iphone-18-pro-2026",
  "localPath": "/mockups/apple-iphone-18-pro-2026.png",
  "file": "apple-iphone-18-pro-2026.png",
  "bytes": 67746,
  "width": 389,
  "height": 800,
  "renderScale": 1.1292134831460674,
  "frameOverlay": true,
  "cssViewport": {
    "width": 402,
    "height": 874
  },
  "screenInset": {
    "left": 19.196629,
    "top": 14.679775,
    "right": 18.067416,
    "bottom": 14.679775
  },
  "viewport": {
    "portrait": {
      "left": 19.196629,
      "top": 14.679775,
      "width": 402,
      "height": 874.011236,
      "enableRotation": true,
      "paths": {
        "portrait": "M0 60.9775L1.1292 51.9438L2.2584 46.2978L3.3876 41.7809L4.5169 38.3933L6.7753 32.7472L10.1629 27.1011L12.4213 23.7135L23.7135 12.4213L27.1011 10.1629L36.1348 5.6461L42.9101 3.3876L47.427 2.2584L54.2022 1.1292L68.882 0L333.118 0L347.7978 1.1292L354.573 2.2584L359.0899 3.3876L362.4775 4.5169L368.1236 6.7753L373.7697 10.1629L378.2865 13.5506L388.4494 23.7135L391.8371 28.2303L396.3539 37.264L399.7416 47.427L400.8708 53.073L402 62.1067L402 811.9045L400.8708 820.9382L399.7416 826.5843L398.6124 831.1011L396.3539 837.8764L394.0955 842.3933L390.7079 848.0393L385.0618 854.8146L382.8034 857.073L377.1573 861.5899L370.382 866.1067L368.1236 867.236L362.4775 869.4944L359.0899 870.6236L347.7978 872.882L333.118 874.0112L68.882 874.0112L54.2022 872.882L47.427 871.7528L42.9101 870.6236L36.1348 868.3652L27.1011 863.8483L23.7135 861.5899L12.4213 850.2978L10.1629 846.9101L6.7753 841.264L4.5169 835.618L3.3876 832.2303L2.2584 827.7135L1.1292 822.0674L0 813.0337ZM156.9607 14.6798H245.0393A18.0674 18.0674 0 0 1 263.1067 32.7472V32.7472A18.0674 18.0674 0 0 1 245.0393 50.8146H156.9607A18.0674 18.0674 0 0 1 138.8933 32.7472V32.7472A18.0674 18.0674 0 0 1 156.9607 14.6798Z"
      },
      "occlusions": [
        {
          "kind": "rounded-rect",
          "left": 138.893258,
          "top": 14.679775,
          "width": 124.213483,
          "height": 36.134831,
          "radius": 18.067416
        }
      ]
    },
    "landscape": {
      "left": 14.679775,
      "top": 19.196629,
      "width": 874.011236,
      "height": 402,
      "enableRotation": true,
      "paths": {
        "landscape": "M813.0337 0L822.0674 1.1292L827.7135 2.2584L832.2303 3.3876L835.618 4.5169L841.264 6.7753L846.9101 10.1629L850.2978 12.4213L861.5899 23.7135L863.8483 27.1011L868.3652 36.1348L870.6236 42.9101L871.7528 47.427L872.882 54.2022L874.0112 68.882L874.0112 333.118L872.882 347.7978L871.7528 354.573L870.6236 359.0899L869.4944 362.4775L867.236 368.1236L863.8483 373.7697L860.4607 378.2865L850.2978 388.4494L845.7809 391.8371L836.7472 396.3539L826.5843 399.7416L820.9382 400.8708L811.9045 402L62.1067 402L53.073 400.8708L47.427 399.7416L42.9101 398.6124L36.1348 396.3539L31.618 394.0955L25.9719 390.7079L19.1966 385.0618L16.9382 382.8034L12.4213 377.1573L7.9045 370.382L6.7753 368.1236L4.5169 362.4775L3.3876 359.0899L1.1292 347.7978L0 333.118L0 68.882L1.1292 54.2022L2.2584 47.427L3.3876 42.9101L5.6461 36.1348L10.1629 27.1011L12.4213 23.7135L23.7135 12.4213L27.1011 10.1629L32.7472 6.7753L38.3933 4.5169L41.7809 3.3876L46.2978 2.2584L51.9438 1.1292L60.9775 0ZM841.264 138.8933H841.264A18.0674 18.0674 0 0 1 859.3315 156.9607V245.0393A18.0674 18.0674 0 0 1 841.264 263.1067H841.264A18.0674 18.0674 0 0 1 823.1966 245.0393V156.9607A18.0674 18.0674 0 0 1 841.264 138.8933Z"
      },
      "occlusions": [
        {
          "kind": "rounded-rect",
          "left": 823.19663,
          "top": 138.893258,
          "width": 36.134831,
          "height": 124.213483,
          "radius": 18.067416
        }
      ]
    }
  }
},
{
  "id": "apple-iphone-18-pro-max-2026",
  "localPath": "/mockups/apple-iphone-18-pro-max-2026.png",
  "file": "apple-iphone-18-pro-max-2026.png",
  "bytes": 36488,
  "width": 389,
  "height": 800,
  "renderScale": 1.2367399741267788,
  "frameOverlay": true,
  "cssViewport": {
    "width": 440,
    "height": 956
  },
  "screenInset": {
    "left": 21.02458,
    "top": 17.31436,
    "right": 19.78784,
    "bottom": 16.07762
  },
  "viewport": {
    "portrait": {
      "left": 21.02458,
      "top": 17.31436,
      "width": 440.279431,
      "height": 956,
      "enableRotation": true,
      "paths": {
        "portrait": "M0 65.5472L1.2367 55.6533L2.4735 49.4696L6.1837 38.3389L9.8939 30.9185L12.3674 27.2083L16.0776 22.2613L23.4981 14.8409L28.445 11.1307L34.6287 7.4204L40.8124 4.947L48.2329 2.4735L54.4166 1.2367L63.0737 0L377.2057 0L385.8629 1.2367L395.7568 3.7102L401.9405 6.1837L404.414 7.4204L410.5977 11.1307L418.0181 17.3144L421.7283 21.0246L426.6753 27.2083L431.6223 34.6287L432.859 37.1022L435.3325 43.2859L436.5692 46.9961L437.806 51.9431L439.0427 58.1268L440.2794 70.4942L440.2794 885.5058L439.0427 897.8732L437.806 904.0569L436.5692 909.0039L435.3325 912.7141L432.859 918.8978L431.6223 921.3713L426.6753 928.7917L420.4916 936.2122L419.2549 937.4489L413.0712 942.3959L405.6507 947.3428L403.1772 948.5796L396.9935 951.053L393.2833 952.2898L388.3364 953.5265L380.9159 954.7633L366.075 956L72.9677 956L58.1268 954.7633L51.9431 953.5265L46.9961 952.2898L39.5757 949.8163L29.6818 944.8693L25.9715 942.3959L13.6041 930.0285L11.1307 926.3182L7.4204 920.1345L4.947 913.9508L3.7102 910.2406L2.4735 905.2937L1.2367 899.11L0 889.216ZM171.2885 16.0776H268.9909A19.1695 19.1695 0 0 1 288.1604 35.2471V35.2471A19.1695 19.1695 0 0 1 268.9909 54.4166H171.2885A19.1695 19.1695 0 0 1 152.119 35.2471V35.2471A19.1695 19.1695 0 0 1 171.2885 16.0776Z"
      },
      "occlusions": [
        {
          "kind": "rounded-rect",
          "left": 152.119017,
          "top": 16.07762,
          "width": 136.041397,
          "height": 38.338939,
          "radius": 19.16947
        }
      ]
    },
    "landscape": {
      "left": 16.07762,
      "top": 21.02458,
      "width": 956,
      "height": 440.279431,
      "enableRotation": true,
      "paths": {
        "landscape": "M890.4528 0L900.3467 1.2367L906.5304 2.4735L917.6611 6.1837L925.0815 9.8939L928.7917 12.3674L933.7387 16.0776L941.1591 23.4981L944.8693 28.445L948.5796 34.6287L951.053 40.8124L953.5265 48.2329L954.7633 54.4166L956 63.0737L956 377.2057L954.7633 385.8629L952.2898 395.7568L949.8163 401.9405L948.5796 404.414L944.8693 410.5977L938.6856 418.0181L934.9754 421.7283L928.7917 426.6753L921.3713 431.6223L918.8978 432.859L912.7141 435.3325L909.0039 436.5692L904.0569 437.806L897.8732 439.0427L885.5058 440.2794L70.4942 440.2794L58.1268 439.0427L51.9431 437.806L46.9961 436.5692L43.2859 435.3325L37.1022 432.859L34.6287 431.6223L27.2083 426.6753L19.7878 420.4916L18.5511 419.2549L13.6041 413.0712L8.6572 405.6507L7.4204 403.1772L4.947 396.9935L3.7102 393.2833L2.4735 388.3364L1.2367 380.9159L0 366.075L0 72.9677L1.2367 58.1268L2.4735 51.9431L3.7102 46.9961L6.1837 39.5757L11.1307 29.6818L13.6041 25.9715L25.9715 13.6041L29.6818 11.1307L35.8655 7.4204L42.0492 4.947L45.7594 3.7102L50.7063 2.4735L56.89 1.2367L66.784 0ZM920.7529 152.119H920.7529A19.1695 19.1695 0 0 1 939.9224 171.2885V268.9909A19.1695 19.1695 0 0 1 920.7529 288.1604H920.7529A19.1695 19.1695 0 0 1 901.5834 268.9909V171.2885A19.1695 19.1695 0 0 1 920.7529 152.119Z"
      },
      "occlusions": [
        {
          "kind": "rounded-rect",
          "left": 901.583441,
          "top": 152.119017,
          "width": 38.338939,
          "height": 136.041397,
          "radius": 19.16947
        }
      ]
    }
  }
},
{
  "id": "apple-iphone-duo-folded-2026",
  "localPath": "/mockups/apple-iphone-duo-folded-2026.png",
  "file": "apple-iphone-duo-folded-2026.png",
  "bytes": 82232,
  "width": 573,
  "height": 800,
  "renderScale": 0.8921052631578947,
  "frameOverlay": true,
  "cssViewport": {
    "width": 466,
    "height": 678
  },
  "screenInset": {
    "left": 26.763158,
    "top": 20.518421,
    "right": 17.842105,
    "bottom": 15.165789
  },
  "viewport": {
    "portrait": {
      "left": 26.763158,
      "top": 20.518421,
      "width": 466.571053,
      "height": 678,
      "enableRotation": true,
      "paths": {
        "portrait": "M0 6.2447L0.8921 3.5684L3.5684 0.8921L5.3526 0L411.2605 0L418.3974 0.8921L425.5342 2.6763L430.8868 4.4605L435.3474 6.2447L437.1316 7.1368L441.5921 9.8132L445.1605 12.4895L454.0816 21.4105L457.65 26.7632L461.2184 33.9L463.8947 41.9289L464.7868 45.4974L465.6789 50.85L466.5711 61.5553L466.5711 615.5526L465.6789 627.15L463.8947 636.0711L462.1105 641.4237L460.3263 645.8842L458.5421 649.4526L454.9737 654.8053L452.2974 658.3737L446.9447 663.7263L443.3763 666.4026L438.0237 669.9711L434.4553 671.7553L429.9947 673.5395L424.6421 675.3237L421.0737 676.2158L415.7211 677.1079L405.9079 678L6.2447 678L2.6763 676.2158L1.7842 675.3237L0.8921 673.5395L0 670.8632ZM418.8434 29.4395H418.8434A18.2882 18.2882 0 0 1 437.1316 47.7276V47.7276A18.2882 18.2882 0 0 1 418.8434 66.0158H418.8434A18.2882 18.2882 0 0 1 400.5553 47.7276V47.7276A18.2882 18.2882 0 0 1 418.8434 29.4395Z"
      },
      "occlusions": [
        {
          "kind": "circle",
          "left": 400.555263,
          "top": 29.439474,
          "width": 36.576316,
          "height": 36.576316
        }
      ]
    },
    "landscape": {
      "left": 15.165789,
      "top": 26.763158,
      "width": 678,
      "height": 466.571053,
      "enableRotation": true,
      "paths": {
        "landscape": "M671.7553 0L674.4316 0.8921L677.1079 3.5684L678 5.3526L678 411.2605L677.1079 418.3974L675.3237 425.5342L673.5395 430.8868L671.7553 435.3474L670.8632 437.1316L668.1868 441.5921L665.5105 445.1605L656.5895 454.0816L651.2368 457.65L644.1 461.2184L636.0711 463.8947L632.5026 464.7868L627.15 465.6789L616.4447 466.5711L62.4474 466.5711L50.85 465.6789L41.9289 463.8947L36.5763 462.1105L32.1158 460.3263L28.5474 458.5421L23.1947 454.9737L19.6263 452.2974L14.2737 446.9447L11.5974 443.3763L8.0289 438.0237L6.2447 434.4553L4.4605 429.9947L2.6763 424.6421L1.7842 421.0737L0.8921 415.7211L0 405.9079L0 6.2447L1.7842 2.6763L2.6763 1.7842L4.4605 0.8921L7.1368 0ZM630.2724 400.5553H630.2724A18.2882 18.2882 0 0 1 648.5605 418.8434V418.8434A18.2882 18.2882 0 0 1 630.2724 437.1316H630.2724A18.2882 18.2882 0 0 1 611.9842 418.8434V418.8434A18.2882 18.2882 0 0 1 630.2724 400.5553Z"
      },
      "occlusions": [
        {
          "kind": "circle",
          "left": 611.98421,
          "top": 400.555263,
          "width": 36.576316,
          "height": 36.576316
        }
      ]
    }
  }
},
{
  "id": "apple-iphone-duo-unfolded-2026",
  "localPath": "/mockups/apple-iphone-duo-unfolded-2026.png",
  "file": "apple-iphone-duo-unfolded-2026.png",
  "bytes": 51095,
  "width": 800,
  "height": 575,
  "renderScale": 1.1635687732342008,
  "frameOverlay": true,
  "cssViewport": {
    "width": 890,
    "height": 626
  },
  "screenInset": {
    "left": 18.6171,
    "top": 23.271375,
    "right": 22.107807,
    "bottom": 19.780669
  },
  "viewport": {
    "landscape": {
      "left": 18.6171,
      "top": 23.271375,
      "width": 890.130112,
      "height": 626,
      "enableRotation": true,
      "paths": {
        "landscape": "M0 46.5428L1.1636 38.3978L2.3271 33.7435L4.6543 27.9257L5.8178 25.5985L10.4721 18.6171L18.6171 10.4721L23.2714 6.9814L30.2528 3.4907L37.2342 1.1636L41.8885 0L848.2416 0L854.0595 1.1636L857.5502 2.3271L863.368 4.6543L869.1859 8.145L876.1673 13.9628L880.8216 19.7807L883.1487 23.2714L887.803 32.5799L888.9665 36.0706L890.1301 41.8885L890.1301 584.1115L888.9665 588.7658L886.6394 595.7472L883.1487 602.7286L879.658 607.3829L871.513 615.5279L864.5316 620.1822L862.2045 621.3457L856.3866 623.6729L851.7323 624.8364L844.7509 626L45.3792 626L38.3978 624.8364L31.4164 622.5093L24.4349 619.0186L20.9442 616.6914L16.29 613.2007L12.7993 609.71L9.3086 605.0558L6.9814 601.5651L3.4907 594.5836L2.3271 591.0929L1.1636 586.4387L0 579.4572Z"
      }
    },
    "portrait": {
      "left": 19.780669,
      "top": 18.6171,
      "width": 626,
      "height": 890.130112,
      "enableRotation": true,
      "paths": {
        "portrait": "M579.4572 0L587.6022 1.1636L592.2565 2.3271L598.0743 4.6543L600.4015 5.8178L607.3829 10.4721L615.5279 18.6171L619.0186 23.2714L622.5093 30.2528L624.8364 37.2342L626 41.8885L626 848.2416L624.8364 854.0595L623.6729 857.5502L621.3457 863.368L617.855 869.1859L612.0372 876.1673L606.2193 880.8216L602.7286 883.1487L593.4201 887.803L589.9294 888.9665L584.1115 890.1301L41.8885 890.1301L37.2342 888.9665L30.2528 886.6394L23.2714 883.1487L18.6171 879.658L10.4721 871.513L5.8178 864.5316L4.6543 862.2045L2.3271 856.3866L1.1636 851.7323L0 844.7509L0 45.3792L1.1636 38.3978L3.4907 31.4164L6.9814 24.4349L9.3086 20.9442L12.7993 16.29L16.29 12.7993L20.9442 9.3086L24.4349 6.9814L31.4164 3.4907L34.9071 2.3271L39.5613 1.1636L46.5428 0Z"
      }
    }
  }
},
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
  "bytes": 66125,
  "width": 388,
  "height": 800,
  "renderScale": 1.1292134831460674,
  "frameOverlay": true,
  "cssViewport": {
    "width": 402,
    "height": 874
  },
  "screenInset": {
    "left": 18.067416,
    "top": 14.679775,
    "right": 18.067416,
    "bottom": 14.679775
  }
},
  {
  "id": "apple-iphone-17-pro-2025",
  "localPath": "/mockups/apple-iphone-17-pro-2025.png",
  "file": "apple-iphone-17-pro-2025.png",
  "bytes": 76617,
  "width": 389,
  "height": 800,
  "renderScale": 1.1292134831460674,
  "frameOverlay": true,
  "cssViewport": {
    "width": 402,
    "height": 873
  },
  "screenInset": {
    "left": 19.196629,
    "top": 14.679775,
    "right": 18.067416,
    "bottom": 14.679775
  }
},
  {
  "id": "apple-iphone-17-pro-max-2025",
  "localPath": "/mockups/apple-iphone-17-pro-max-2025.png",
  "file": "apple-iphone-17-pro-max-2025.png",
  "bytes": 49325,
  "width": 389,
  "height": 800,
  "renderScale": 1.2367399741267788,
  "frameOverlay": true,
  "cssViewport": {
    "width": 440,
    "height": 956
  },
  "screenInset": {
    "left": 21.02458,
    "top": 17.31436,
    "right": 19.78784,
    "bottom": 16.07762
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
  "bytes": 47132,
  "width": 388,
  "height": 800,
  "renderScale": 1.176774193548387,
  "frameOverlay": true,
  "cssViewport": {
    "width": 420,
    "height": 912
  },
  "screenInset": {
    "left": 17.651613,
    "top": 15.298065,
    "right": 17.651613,
    "bottom": 14.12129
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
  "bytes": 33923,
  "width": 385,
  "height": 800,
  "renderScale": 1.1444444444444444,
  "frameOverlay": true,
  "cssViewport": {
    "width": 412,
    "height": 891
  },
  "screenInset": {
    "left": 12.588889,
    "top": 11.444444,
    "right": 16.022222,
    "bottom": 12.588889
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
  "bytes": 31895,
  "width": 379,
  "height": 800,
  "renderScale": 1.2117647058823529,
  "frameOverlay": true,
  "cssViewport": {
    "width": 412,
    "height": 924
  },
  "screenInset": {
    "left": 21.811765,
    "top": 23.023529,
    "right": 25.447059,
    "bottom": 21.811765
  }
},
  {
  "id": "google-pixel-10-pro-2026",
  "localPath": "/mockups/google-pixel-10-pro-2026.png",
  "file": "google-pixel-10-pro-2026.png",
  "bytes": 33641,
  "width": 380,
  "height": 800,
  "renderScale": 1.1849710982658959,
  "frameOverlay": true,
  "cssViewport": {
    "width": 410,
    "height": 912
  },
  "screenInset": {
    "left": 17.774566,
    "top": 16.589595,
    "right": 22.514451,
    "bottom": 17.774566
  }
},
  {
  "id": "google-pixel-10-pro-fold-2026",
  "localPath": "/mockups/google-pixel-10-pro-fold-2026.png",
  "file": "google-pixel-10-pro-fold-2026.png",
  "bytes": 63488,
  "width": 395,
  "height": 800,
  "renderScale": 1.1907514450867052,
  "frameOverlay": true,
  "cssViewport": {
    "width": 412,
    "height": 901
  },
  "screenInset": {
    "left": 30.959538,
    "top": 25.00578,
    "right": 27.387283,
    "bottom": 25.00578
  }
},
  {
    "id": "google-pixel-11-2026",
    "localPath": "/mockups/google-pixel-11-2026.png",
    "file": "google-pixel-11-2026.png",
    "bytes": 250048,
    "width": 1554,
    "height": 1243,
    "sourceCrop": { "left": 541, "top": 120, "width": 476, "height": 1005 },
    "screenInset": { "top": 11.5, "right": 13, "bottom": 12.5, "left": 11.5 },
    "viewport": {
      "portrait": {
        "left": 11.5, "top": 11.5, "width": 213.5, "height": 478.5, "cornerRadius": 28,
        "occlusions": [{ "kind": "circle", "left": 98.5, "top": 9, "width": 16, "height": 16 }],
        "paths": {
          "portrait": "M24.5 0H188.5A25 28.5 0 0 1 213.5 28.5V450.5A25 28 0 0 1 188.5 478.5H25A25 28 0 0 1 0 450.5V28.5A24.5 28.5 0 0 1 24.5 0ZM98.5 17A8 8 0 1 0 114.5 17A8 8 0 1 0 98.5 17Z"
        },
        "enableRotation": true
      },
      "landscape": {
        "left": 12.5, "top": 11.5, "width": 478.5, "height": 213.5, "cornerRadius": 28,
        "occlusions": [{ "kind": "circle", "left": 453.5, "top": 98.5, "width": 16, "height": 16 }],
        "paths": {
          "landscape": "M28 0H450A28.5 24.5 0 0 1 478.5 24.5V188.5A28.5 25 0 0 1 450 213.5H28A28 25 0 0 1 0 188.5V25A28 25 0 0 1 28 0ZM453.5 106.5A8 8 0 1 0 469.5 106.5A8 8 0 1 0 453.5 106.5Z"
        },
        "enableRotation": true
      }
    }
  },
  {
    "id": "google-pixel-11-pro-2026",
    "localPath": "/mockups/google-pixel-11-pro-2026.png",
    "file": "google-pixel-11-pro-2026.png",
    "bytes": 138167,
    "width": 1554,
    "height": 1243,
    "sourceCrop": { "left": 554, "top": 180, "width": 448, "height": 945 },
    "screenInset": { "top": 9.5, "right": 11, "bottom": 11, "left": 10.5 },
    "viewport": {
      "portrait": {
        "left": 10.5, "top": 9.5, "width": 202.5, "height": 452, "cornerRadius": 26,
        "occlusions": [{ "kind": "circle", "left": 93.5, "top": 8.5, "width": 15, "height": 15.5 }],
        "enableRotation": true
      },
      "landscape": {
        "left": 11, "top": 10.5, "width": 452, "height": 202.5, "cornerRadius": 26,
        "occlusions": [{ "kind": "circle", "left": 428, "top": 93.5, "width": 15.5, "height": 15 }],
        "enableRotation": true
      }
    }
  },
  {
    "id": "google-pixel-11-pro-xl-2026",
    "localPath": "/mockups/google-pixel-11-pro-xl-2026.png",
    "file": "google-pixel-11-pro-xl-2026.png",
    "bytes": 149069,
    "width": 1554,
    "height": 1243,
    "sourceCrop": { "left": 541, "top": 119, "width": 475, "height": 1006 },
    "screenInset": { "top": 10.5, "right": 10.5, "bottom": 10.5, "left": 9.5 },
    "viewport": {
      "portrait": {
        "left": 9.5, "top": 10.5, "width": 217.5, "height": 482, "cornerRadius": 28,
        "occlusions": [{ "kind": "circle", "left": 101.5, "top": 8, "width": 14, "height": 14 }],
        "enableRotation": true
      },
      "landscape": {
        "left": 10.5, "top": 9.5, "width": 482, "height": 217.5, "cornerRadius": 28,
        "occlusions": [{ "kind": "circle", "left": 460, "top": 101.5, "width": 14, "height": 14 }],
        "enableRotation": true
      }
    }
  },
  {
    "id": "google-pixel-11-pro-fold-2026",
    "localPath": "/mockups/google-pixel-11-pro-fold-2026.png",
    "file": "google-pixel-11-pro-fold-2026.png",
    "bytes": 215187,
    "width": 1554,
    "height": 1243,
    "sourceCrop": { "left": 290, "top": 120, "width": 976, "height": 1006 },
    "screenInset": { "top": 14, "right": 16, "bottom": 15, "left": 15 },
    "viewport": {
      "portrait": {
        "left": 15, "top": 14, "width": 457, "height": 474, "cornerRadius": 24,
        "occlusions": [{ "kind": "circle", "left": 429, "top": 9, "width": 17, "height": 17 }],
        "enableRotation": true
      },
      "landscape": {
        "left": 15, "top": 15, "width": 474, "height": 457, "cornerRadius": 24,
        "occlusions": [{ "kind": "circle", "left": 448, "top": 429, "width": 17, "height": 17 }],
        "enableRotation": true
      }
    }
  },
  {
  "id": "samsung-galaxy-a17-2025",
  "localPath": "/mockups/samsung-galaxy-a17-2025.png",
  "file": "samsung-galaxy-a17-2025.png",
  "bytes": 50023,
  "width": 384,
  "height": 800,
  "renderScale": 1.197674418604651,
  "frameOverlay": true,
  "cssViewport": {
    "width": 412,
    "height": 892
  },
  "screenInset": {
    "left": 21.55814,
    "top": 21.55814,
    "right": 26.348837,
    "bottom": 41.918605
  }
},
  {
  "id": "motorola-razr-70-ultra-2026",
  "localPath": "/mockups/motorola-razr-70-ultra-2026.png",
  "file": "motorola-razr-70-ultra-2026.png",
  "bytes": 51571,
  "width": 352,
  "height": 800,
  "renderScale": 1.331571994715984,
  "frameOverlay": true,
  "cssViewport": {
    "width": 412,
    "height": 1008
  },
  "screenInset": {
    "left": 27.963012,
    "top": 27.963012,
    "right": 27.963012,
    "bottom": 29.294584
  }
},
  {
  "id": "infinix-hot-70-2026",
  "localPath": "/mockups/infinix-hot-70-2026.png",
  "file": "infinix-hot-70-2026.png",
  "bytes": 57140,
  "width": 379,
  "height": 800,
  "renderScale": 1.0506666666666666,
  "frameOverlay": true,
  "cssViewport": {
    "width": 360,
    "height": 788
  },
  "screenInset": {
    "left": 17.861333,
    "top": 22.064,
    "right": 19.962667,
    "bottom": 30.469333
  }
},
  {
    "id": "samsung-galaxy-s26-2026",
    "localPath": "/mockups/samsung-galaxy-s26.png",
    "file": "samsung-galaxy-s26.png",
    "bytes": 347910,
    "width": 746,
    "height": 1577,
    "cssViewport": { "width": 360, "height": 780 },
    "screenInset": {
      "top": 4.85,
      "right": 7.77,
      "bottom": 3.88,
      "left": 5
    }
  },
  {
    "id": "samsung-galaxy-z-fold7-unfolded-2025",
    "localPath": "/mockups/samsung-galaxy-z-fold7-unfolded.png",
    "file": "samsung-galaxy-z-fold7-unfolded.png",
    "bytes": 509709,
    "width": 1842,
    "height": 1687,
    "cssViewport": { "width": 874, "height": 787 },
    "screenInset": {
      "top": 5.32,
      "right": 19.49,
      "bottom": 6.21,
      "left": 17.72
    }
  },
  {
    "id": "samsung-galaxy-z-fold8-folded-2026",
    "localPath": "/mockups/samsung-galaxy-z-fold8-folded.png",
    "file": "samsung-galaxy-z-fold8-folded.png",
    "bytes": 1284234,
    "width": 898,
    "height": 1340,
    "cssViewport": { "width": 416, "height": 657 },
    "screenInset": { "top": 23.5, "right": 25.5, "bottom": 22.5, "left": 28.5 }
  },
  {
    "id": "samsung-galaxy-z-fold8-unfolded-2026",
    "localPath": "/mockups/samsung-galaxy-z-fold8-unfolded.png",
    "file": "samsung-galaxy-z-fold8-unfolded.png",
    "bytes": 4165746,
    "width": 1994,
    "height": 1530,
    "cssViewport": { "width": 979, "height": 739 },
    "screenInset": { "top": 23, "right": 20, "bottom": 22, "left": 21 }
  },
  {
    "id": "samsung-galaxy-z-fold8-ultra-folded-2026",
    "localPath": "/mockups/samsung-galaxy-z-fold8-ultra-folded.png",
    "file": "samsung-galaxy-z-fold8-ultra-folded.png",
    "bytes": 1489963,
    "width": 798,
    "height": 1700,
    "cssViewport": { "width": 360, "height": 840 },
    "screenInset": { "top": 24, "right": 26, "bottom": 23, "left": 28 }
  },
  {
    "id": "samsung-galaxy-z-fold8-ultra-unfolded-2026",
    "localPath": "/mockups/samsung-galaxy-z-fold8-ultra-unfolded.png",
    "file": "samsung-galaxy-z-fold8-ultra-unfolded.png",
    "bytes": 3297926,
    "width": 1854,
    "height": 2040,
    "cssViewport": { "width": 902, "height": 1002 },
    "screenInset": { "top": 26, "right": 25, "bottom": 18, "left": 25 }
  },
  {
    "id": "samsung-galaxy-z-flip8-folded-2026",
    "localPath": "/mockups/samsung-galaxy-z-flip8-folded.png",
    "file": "samsung-galaxy-z-flip8-folded.png",
    "bytes": 406856,
    "width": 676,
    "height": 760,
    "cssViewport": { "width": 316, "height": 349 },
    "screenInset": { "top": 28, "right": 18, "bottom": 16, "left": 16 }
  },
  {
    "id": "samsung-galaxy-z-flip8-unfolded-2026",
    "localPath": "/mockups/samsung-galaxy-z-flip8-unfolded.png",
    "file": "samsung-galaxy-z-flip8-unfolded.png",
    "bytes": 1004624,
    "width": 786,
    "height": 1700,
    "cssViewport": { "width": 360, "height": 840 },
    "screenInset": { "top": 21, "right": 22, "bottom": 22, "left": 22 }
  },
  {
    "id": "samsung-galaxy-a27-5g-2026",
    "localPath": "/mockups/samsung-galaxy-a27-5g.png",
    "file": "samsung-galaxy-a27-5g.png",
    "bytes": 1210667,
    "width": 792,
    "height": 1600,
    "cssViewport": { "width": 360, "height": 780 },
    "screenInset": { "top": 25, "right": 28, "bottom": 30, "left": 24 }
  },
  {
  "id": "google-pixel-10-pro-xl-2025",
  "localPath": "/mockups/google-pixel-10-pro-2026.png",
  "file": "google-pixel-10-pro-2026.png",
  "bytes": 33641,
  "width": 380,
  "height": 800,
  "renderScale": 1.1849710982658959,
  "frameOverlay": true,
  "cssViewport": {
    "width": 448,
    "height": 997
  },
  "screenInset": {
    "left": 17.774566,
    "top": 16.589595,
    "right": 22.514451,
    "bottom": 17.774566
  },
  "viewportSourceId": "google-pixel-10-pro-2026"
},
  {
    "id": "modern-laptop-15",
    "localPath": "/mockups/modern-laptop-15.png",
    "file": "modern-laptop-15.png",
    "bytes": 1532814,
    "width": 3416,
    "height": 2240,
    "cssViewport": { "width": 1440, "height": 900 },
    "screenInset": {
      "top": 34,
      "right": 178.8,
      "bottom": 242,
      "left": 178.8
    }
  },
  {
  "id": "apple-iphone-16-pro-2024",
  "localPath": "/mockups/apple-iphone-17-pro-2025.png",
  "file": "apple-iphone-17-pro-2025.png",
  "bytes": 76617,
  "width": 389,
  "height": 800,
  "renderScale": 1.1292134831460674,
  "frameOverlay": true,
  "cssViewport": {
    "width": 402,
    "height": 874
  },
  "screenInset": {
    "left": 19.196629,
    "top": 14.679775,
    "right": 18.067416,
    "bottom": 14.679775
  },
  "viewportSourceId": "apple-iphone-17-pro-2025"
},
  {
    "id": "apple-iphone-16e-2025",
    "localPath": "/mockups/apple-iphone-14-2022.png",
    "file": "apple-iphone-14-2022.png",
    "bytes": 46800,
    "width": 870,
    "height": 1772,
    "cssViewport": { "width": 390, "height": 844 },
    "screenInset": { "top": 7, "right": 8.5, "bottom": 9.5, "left": 10.5 },
    "viewportSourceId": "apple-iphone-14-2022"
  },
  {
    "id": "apple-iphone-17e-2026",
    "localPath": "/mockups/apple-iphone-17e-2026.png",
    "file": "apple-iphone-17e-2026.png",
    "bytes": 102865,
    "width": 696,
    "height": 1404,
    "renderScale": 0.6,
    "previewScale": 0.88,
    "frameOverlay": true,
    "sourceCrop": { "left": 0, "top": 0, "width": 696, "height": 1404 },
    "cssViewport": { "width": 390, "height": 844 },
    "screenInset": { "top": 20.4, "right": 25.2, "bottom": 22.8, "left": 25.2 }
  },
  {
    "id": "apple-ipad-pro-13-m4-2024",
    "localPath": "/mockups/apple-ipad-pro-13.png",
    "file": "apple-ipad-pro-13.png",
    "bytes": 614058,
    "width": 2275,
    "height": 2960,
    "cssViewport": { "width": 1032, "height": 1376 },
    "screenInset": { "top": 50.5, "right": 50.5, "bottom": 53.5, "left": 55 }
  },
  {
    "id": "apple-ipad-air-13-m4-2026",
    "localPath": "/mockups/apple-ipad-pro-13.png",
    "file": "apple-ipad-pro-13.png",
    "bytes": 614058,
    "width": 2275,
    "height": 2960,
    "cssViewport": { "width": 1024, "height": 1366 },
    "screenInset": { "top": 50.5, "right": 50.5, "bottom": 53.5, "left": 55 }
  },
  {
    "id": "apple-ipad-mini-a17-pro-2024",
    "localPath": "/mockups/ipad-mini-modern.svg",
    "file": "ipad-mini-modern.svg",
    "bytes": 924,
    "width": 840,
    "height": 1218,
    "renderScale": 1,
    "frameOverlay": true,
    "cssViewport": { "width": 744, "height": 1133 },
    "screenInset": { "left": 48, "right": 48, "top": 42.5, "bottom": 42.5 },
    "viewport": {
      "portrait": { "left": 48, "top": 42.5, "width": 744, "height": 1133, "cornerRadius": 18, "enableRotation": true },
      "landscape": { "left": 42.5, "top": 48, "width": 1133, "height": 744, "cornerRadius": 18, "enableRotation": true }
    }
  },
  {
    "id": "apple-macbook-air-13-m4-2025",
    "localPath": "/mockups/macbook-air.png",
    "file": "macbook-air.png",
    "bytes": 130937,
    "width": 3296,
    "height": 1894,
    "screenInset": { "top": 4, "right": 154, "bottom": 37.5, "left": 153 }
  },
  {
    "id": "apple-macbook-pro-14-m5-2025",
    "localPath": "/mockups/apple-macbook-pro-16-2021.png",
    "file": "apple-macbook-pro-16-2021.png",
    "bytes": 323138,
    "width": 4244,
    "height": 2594,
    "screenInset": { "top": 10.5, "right": 172, "bottom": 128.5, "left": 171 }
  },
  {
    "id": "samsung-galaxy-s26-plus-2026",
    "localPath": "/mockups/samsung-galaxy-s26-plus-2026.png",
    "file": "samsung-galaxy-s26-plus-2026.png",
    "bytes": 496694,
    "width": 1920,
    "height": 1280,
    "renderScale": 1,
    "previewScale": 0.88,
    "sourceCrop": { "left": 690, "top": 80, "width": 550, "height": 1130 },
    "cssViewport": { "width": 384, "height": 832 },
    "screenInset": { "top": 32, "right": 32, "bottom": 40, "left": 26 }
  },
  {
    "id": "samsung-galaxy-z-flip7-2025",
    "localPath": "/mockups/samsung-galaxy-z-flip7.png",
    "file": "samsung-galaxy-z-flip7.png",
    "bytes": 301466,
    "width": 795,
    "height": 1785,
    "cssViewport": { "width": 360, "height": 840 },
    "screenInset": { "top": 37, "right": 20.5, "bottom": 15.5, "left": 17 }
  },
  {
    "id": "samsung-galaxy-tab-s11-ultra-2025",
    "localPath": "/mockups/samsung-galaxy-tab-s11-ultra.png",
    "file": "samsung-galaxy-tab-s11-ultra.png",
    "bytes": 723229,
    "width": 2022,
    "height": 3117,
    "cssViewport": { "width": 924, "height": 1480 },
    "screenInset": { "top": 39.5, "right": 35.5, "bottom": 39, "left": 51.5 }
  },
  {
    "id": "samsung-galaxy-xcover7-pro-2025",
    "localPath": "/mockups/samsung-galaxy-a12-2021.png",
    "file": "samsung-galaxy-a12-2021.png",
    "bytes": 43247,
    "width": 794,
    "height": 1718,
    "viewportSourceId": "samsung-galaxy-a12-2021",
    "cssViewport": { "width": 360, "height": 803 },
    "screenInset": { "top": 8, "right": 12, "bottom": 8, "left": 9 }
  },
  {
    "id": "google-pixel-10a-2026",
    "localPath": "/mockups/google-pixel-10a-2026.webp",
    "file": "google-pixel-10a-2026.webp",
    "bytes": 23526,
    "width": 1200,
    "height": 898,
    "renderScale": 1,
    "previewScale": 0.88,
    "sourceCrop": { "left": 696, "top": 60, "width": 366, "height": 767 },
    "cssViewport": { "width": 412, "height": 924 },
    "screenInset": { "top": 20, "right": 22, "bottom": 20, "left": 20 }
  },
  {
    "id": "motorola-edge-60-pro-2025",
    "localPath": "/mockups/xiaomi-12-2022.png",
    "file": "xiaomi-12-2022.png",
    "bytes": 39658,
    "width": 770,
    "height": 1670,
    "viewportSourceId": "xiaomi-12-2022",
    "cssViewport": { "width": 407, "height": 904 },
    "screenInset": { "top": 10.5, "right": 14, "bottom": 11.5, "left": 11 }
  },
  {
    "id": "motorola-thinkphone-25-2024",
    "localPath": "/mockups/xiaomi-12-2022.png",
    "file": "xiaomi-12-2022.png",
    "bytes": 39658,
    "width": 770,
    "height": 1670,
    "viewportSourceId": "xiaomi-12-2022",
    "cssViewport": { "width": 407, "height": 904 },
    "screenInset": { "top": 10.5, "right": 14, "bottom": 11.5, "left": 11 }
  },
  {
  "id": "motorola-razr-60-ultra-2025",
  "localPath": "/mockups/motorola-razr-70-ultra-2026.png",
  "file": "motorola-razr-70-ultra-2026.png",
  "bytes": 51571,
  "width": 352,
  "height": 800,
  "renderScale": 1.331571994715984,
  "frameOverlay": true,
  "cssViewport": {
    "width": 412,
    "height": 1008
  },
  "screenInset": {
    "left": 27.963012,
    "top": 27.963012,
    "right": 27.963012,
    "bottom": 29.294584
  },
  "viewportSourceId": "motorola-razr-70-ultra-2026"
},
  {
    "id": "zebra-tc58-2022",
    "localPath": "/mockups/zebra-tc58.png",
    "file": "zebra-tc58.png",
    "bytes": 885146,
    "width": 983,
    "height": 1895,
    "cssViewport": { "width": 412, "height": 823 },
    "screenInset": { "top": 66, "right": 39.5, "bottom": 58.5, "left": 40 }
  },
  {
    "id": "honeywell-ct47-2023",
    "localPath": "/mockups/zebra-tc58.png",
    "file": "zebra-tc58.png",
    "bytes": 885146,
    "width": 983,
    "height": 1895,
    "cssViewport": { "width": 412, "height": 823 },
    "screenInset": { "top": 66, "right": 39.5, "bottom": 58.5, "left": 40 }
  },
  {
    "id": "panasonic-toughbook-s1-2021",
    "localPath": "/mockups/panasonic-toughbook-s1.png",
    "file": "panasonic-toughbook-s1.png",
    "bytes": 2152702,
    "width": 1493,
    "height": 2138,
    "cssViewport": { "width": 533, "height": 853 },
    "screenInset": { "top": 110.5, "right": 106.5, "bottom": 105.5, "left": 107 }
  },
  {
    "id": "microsoft-surface-laptop-7-2024",
    "localPath": "/mockups/modern-laptop-15.png",
    "file": "modern-laptop-15.png",
    "bytes": 1532814,
    "width": 3416,
    "height": 2240,
    "cssViewport": { "width": 1440, "height": 900 },
    "screenInset": { "top": 7.86, "right": 134.02, "bottom": 212.23, "left": 134.02 }
  },
  {
    "id": "dell-xps-13-9350-2024",
    "localPath": "/mockups/modern-laptop-15.png",
    "file": "modern-laptop-15.png",
    "bytes": 1532814,
    "width": 3416,
    "height": 2240,
    "cssViewport": { "width": 1440, "height": 900 },
    "screenInset": { "top": 7.86, "right": 134.02, "bottom": 212.23, "left": 134.02 }
  },
  {
  "id": "apple-macbook-neo-13-2026",
  "localPath": "/mockups/apple-macbook-neo-13-2026.png",
  "file": "apple-macbook-neo-13-2026.png",
  "bytes": 48999,
  "width": 800,
  "height": 488,
  "renderScale": 1.873134328358209,
  "frameOverlay": true,
  "cssViewport": {
    "width": 1204,
    "height": 753
  },
  "screenInset": {
    "left": 146.104478,
    "top": 41.208955,
    "right": 146.104478,
    "bottom": 119.880597
  }
},
  {
    "id": "microsoft-surface-laptop-8-13-8-2026",
    "localPath": "/mockups/microsoft-surface-laptop-8-13-8-2026.png",
    "file": "microsoft-surface-laptop-8-13-8-2026.png",
    "bytes": 752654,
    "width": 1440,
    "height": 1440,
    "renderScale": 1,
    "previewScale": 0.88,
    "sourceCrop": { "left": 60, "top": 250, "width": 1320, "height": 1010 },
    "cssViewport": { "width": 1152, "height": 768 },
    "screenInset": { "top": 48, "right": 258, "bottom": 386, "left": 208 }
  },
  {
    "id": "apple-studio-display-xdr-27-2026",
    "localPath": "/mockups/apple-studio-display-xdr-27-2026.png",
    "file": "apple-studio-display-xdr-27-2026.png",
    "bytes": 312798,
    "width": 1800,
    "height": 1400,
    "renderScale": 1,
    "previewScale": 0.88,
    "sourceCrop": { "left": 550, "top": 420, "width": 700, "height": 650 },
    "cssViewport": { "width": 2560, "height": 1440 },
    "screenInset": { "top": 90, "right": 98, "bottom": 271, "left": 99 }
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
  "portrait": {
    "left": 18.067416,
    "top": 14.679775,
    "width": 402.0,
    "height": 874.011236,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 62.1067L1.1292 51.9438L2.2584 46.2978L5.6461 36.1348L9.0337 29.3596L11.2921 25.9719L15.809 20.3258L20.3258 15.809L24.8427 12.4213L28.2303 10.1629L39.5225 4.5169L47.427 2.2584L54.2022 1.1292L64.3652 0L337.6348 0L347.7978 1.1292L354.573 2.2584L359.0899 3.3876L362.4775 4.5169L373.7697 10.1629L377.1573 12.4213L381.6742 15.809L386.191 20.3258L390.7079 25.9719L392.9663 29.3596L396.3539 36.1348L399.7416 46.2978L400.8708 51.9438L402 62.1067L402 811.9045L400.8708 822.0674L399.7416 827.7135L396.3539 837.8764L392.9663 844.6517L390.7079 848.0393L386.191 853.6854L381.6742 858.2022L377.1573 861.5899L373.7697 863.8483L362.4775 869.4944L359.0899 870.6236L354.573 871.7528L347.7978 872.882L337.6348 874.0112L64.3652 874.0112L54.2022 872.882L47.427 871.7528L42.9101 870.6236L39.5225 869.4944L28.2303 863.8483L24.8427 861.5899L20.3258 858.2022L15.809 853.6854L11.2921 848.0393L9.0337 844.6517L5.6461 837.8764L2.2584 827.7135L1.1292 822.0674L0 811.9045ZM156.9607 14.6798H245.0393A18.0674 18.0674 0 0 1 263.1067 32.7472V32.7472A18.0674 18.0674 0 0 1 245.0393 50.8146H156.9607A18.0674 18.0674 0 0 1 138.8933 32.7472V32.7472A18.0674 18.0674 0 0 1 156.9607 14.6798Z"
    },
    "occlusions": [
      {
        "kind": "rounded-rect",
        "left": 138.893258,
        "top": 14.679775,
        "width": 124.213483,
        "height": 36.134831,
        "radius": 18.067416
      }
    ]
  },
  "landscape": {
    "left": 14.679775,
    "top": 18.067416,
    "width": 874.011236,
    "height": 402.0,
    "enableRotation": true,
    "paths": {
      "landscape": "M811.9045 0L822.0674 1.1292L827.7135 2.2584L837.8764 5.6461L844.6517 9.0337L848.0393 11.2921L853.6854 15.809L858.2022 20.3258L861.5899 24.8427L863.8483 28.2303L869.4944 39.5225L871.7528 47.427L872.882 54.2022L874.0112 64.3652L874.0112 337.6348L872.882 347.7978L871.7528 354.573L870.6236 359.0899L869.4944 362.4775L863.8483 373.7697L861.5899 377.1573L858.2022 381.6742L853.6854 386.191L848.0393 390.7079L844.6517 392.9663L837.8764 396.3539L827.7135 399.7416L822.0674 400.8708L811.9045 402L62.1067 402L51.9438 400.8708L46.2978 399.7416L36.1348 396.3539L29.3596 392.9663L25.9719 390.7079L20.3258 386.191L15.809 381.6742L12.4213 377.1573L10.1629 373.7697L4.5169 362.4775L3.3876 359.0899L2.2584 354.573L1.1292 347.7978L0 337.6348L0 64.3652L1.1292 54.2022L2.2584 47.427L3.3876 42.9101L4.5169 39.5225L10.1629 28.2303L12.4213 24.8427L15.809 20.3258L20.3258 15.809L25.9719 11.2921L29.3596 9.0337L36.1348 5.6461L46.2978 2.2584L51.9438 1.1292L62.1067 0ZM841.264 138.8933H841.264A18.0674 18.0674 0 0 1 859.3315 156.9607V245.0393A18.0674 18.0674 0 0 1 841.264 263.1067H841.264A18.0674 18.0674 0 0 1 823.1966 245.0393V156.9607A18.0674 18.0674 0 0 1 841.264 138.8933Z"
    },
    "occlusions": [
      {
        "kind": "rounded-rect",
        "left": 823.19663,
        "top": 138.893258,
        "width": 36.134831,
        "height": 124.213483,
        "radius": 18.067416
      }
    ]
  }
},
  "apple-iphone-air-2025": {
  "portrait": {
    "left": 17.651613,
    "top": 15.298065,
    "width": 421.285161,
    "height": 912.0,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 74.1368L1.1768 54.1316L2.3535 47.071L3.5303 42.3639L4.7071 38.8335L7.0606 32.9497L8.2374 30.5961L12.9445 23.5355L23.5355 12.9445L30.5961 8.2374L35.3032 5.8839L41.1871 3.5303L50.6013 1.1768L58.8387 0L362.4465 0L370.6839 1.1768L380.0981 3.5303L385.9819 5.8839L390.689 8.2374L397.7497 12.9445L408.3406 23.5355L413.0477 30.5961L414.2245 32.9497L416.5781 38.8335L417.7548 42.3639L418.9316 47.071L420.1084 54.1316L421.2852 74.1368L421.2852 837.8632L420.1084 857.8684L417.7548 869.6361L416.5781 873.1665L410.6942 884.9342L408.3406 888.4645L397.7497 899.0555L390.689 903.7626L385.9819 906.1161L375.391 909.6465L369.5071 910.8232L360.0929 912L61.1923 912L51.7781 910.8232L45.8942 909.6465L38.8335 907.2929L32.9497 904.9394L27.0658 901.409L23.5355 899.0555L14.1213 889.6413L10.591 884.9342L4.7071 873.1665L3.5303 869.6361L1.1768 857.8684L0 837.8632ZM166.5135 20.0052H254.7716A18.24 18.24 0 0 1 273.0116 38.2452V38.2452A18.24 18.24 0 0 1 254.7716 56.4852H166.5135A18.24 18.24 0 0 1 148.2735 38.2452V38.2452A18.24 18.24 0 0 1 166.5135 20.0052Z"
    },
    "occlusions": [
      {
        "kind": "rounded-rect",
        "left": 148.273548,
        "top": 20.005161,
        "width": 124.738065,
        "height": 36.48,
        "radius": 18.24
      }
    ]
  },
  "landscape": {
    "left": 14.12129,
    "top": 17.651613,
    "width": 912.0,
    "height": 421.285161,
    "enableRotation": true,
    "paths": {
      "landscape": "M837.8632 0L857.8684 1.1768L864.929 2.3535L869.6361 3.5303L873.1665 4.7071L879.0503 7.0606L881.4039 8.2374L888.4645 12.9445L899.0555 23.5355L903.7626 30.5961L906.1161 35.3032L908.4697 41.1871L910.8232 50.6013L912 58.8387L912 362.4465L910.8232 370.6839L908.4697 380.0981L906.1161 385.9819L903.7626 390.689L899.0555 397.7497L888.4645 408.3406L881.4039 413.0477L879.0503 414.2245L873.1665 416.5781L869.6361 417.7548L864.929 418.9316L857.8684 420.1084L837.8632 421.2852L74.1368 421.2852L54.1316 420.1084L42.3639 417.7548L38.8335 416.5781L27.0658 410.6942L23.5355 408.3406L12.9445 397.7497L8.2374 390.689L5.8839 385.9819L2.3535 375.391L1.1768 369.5071L0 360.0929L0 61.1923L1.1768 51.7781L2.3535 45.8942L4.7071 38.8335L7.0606 32.9497L10.591 27.0658L12.9445 23.5355L22.3587 14.1213L27.0658 10.591L38.8335 4.7071L42.3639 3.5303L54.1316 1.1768L74.1368 0ZM873.7548 148.2735H873.7548A18.24 18.24 0 0 1 891.9948 166.5135V254.7716A18.24 18.24 0 0 1 873.7548 273.0116H873.7548A18.24 18.24 0 0 1 855.5148 254.7716V166.5135A18.24 18.24 0 0 1 873.7548 148.2735Z"
    },
    "occlusions": [
      {
        "kind": "rounded-rect",
        "left": 855.514839,
        "top": 148.273548,
        "width": 36.48,
        "height": 124.738065,
        "radius": 18.24
      }
    ]
  }
},
  "apple-iphone-17-pro-2025": {
  "portrait": {
    "left": 19.196629,
    "top": 14.679775,
    "width": 402.0,
    "height": 874.011236,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 60.9775L1.1292 51.9438L2.2584 46.2978L3.3876 41.7809L4.5169 38.3933L6.7753 32.7472L10.1629 27.1011L12.4213 23.7135L23.7135 12.4213L27.1011 10.1629L36.1348 5.6461L42.9101 3.3876L47.427 2.2584L54.2022 1.1292L68.882 0L333.118 0L347.7978 1.1292L354.573 2.2584L359.0899 3.3876L362.4775 4.5169L368.1236 6.7753L373.7697 10.1629L378.2865 13.5506L388.4494 23.7135L391.8371 28.2303L396.3539 37.264L399.7416 47.427L400.8708 53.073L402 62.1067L402 811.9045L400.8708 820.9382L399.7416 826.5843L398.6124 831.1011L396.3539 837.8764L394.0955 842.3933L390.7079 848.0393L385.0618 854.8146L382.8034 857.073L377.1573 861.5899L370.382 866.1067L368.1236 867.236L362.4775 869.4944L359.0899 870.6236L347.7978 872.882L333.118 874.0112L68.882 874.0112L54.2022 872.882L47.427 871.7528L42.9101 870.6236L36.1348 868.3652L27.1011 863.8483L23.7135 861.5899L12.4213 850.2978L10.1629 846.9101L6.7753 841.264L4.5169 835.618L3.3876 832.2303L2.2584 827.7135L1.1292 822.0674L0 813.0337ZM156.9607 14.6798H245.0393A18.0674 18.0674 0 0 1 263.1067 32.7472V32.7472A18.0674 18.0674 0 0 1 245.0393 50.8146H156.9607A18.0674 18.0674 0 0 1 138.8933 32.7472V32.7472A18.0674 18.0674 0 0 1 156.9607 14.6798Z"
    },
    "occlusions": [
      {
        "kind": "rounded-rect",
        "left": 138.893258,
        "top": 14.679775,
        "width": 124.213483,
        "height": 36.134831,
        "radius": 18.067416
      }
    ]
  },
  "landscape": {
    "left": 14.679775,
    "top": 19.196629,
    "width": 874.011236,
    "height": 402.0,
    "enableRotation": true,
    "paths": {
      "landscape": "M813.0337 0L822.0674 1.1292L827.7135 2.2584L832.2303 3.3876L835.618 4.5169L841.264 6.7753L846.9101 10.1629L850.2978 12.4213L861.5899 23.7135L863.8483 27.1011L868.3652 36.1348L870.6236 42.9101L871.7528 47.427L872.882 54.2022L874.0112 68.882L874.0112 333.118L872.882 347.7978L871.7528 354.573L870.6236 359.0899L869.4944 362.4775L867.236 368.1236L863.8483 373.7697L860.4607 378.2865L850.2978 388.4494L845.7809 391.8371L836.7472 396.3539L826.5843 399.7416L820.9382 400.8708L811.9045 402L62.1067 402L53.073 400.8708L47.427 399.7416L42.9101 398.6124L36.1348 396.3539L31.618 394.0955L25.9719 390.7079L19.1966 385.0618L16.9382 382.8034L12.4213 377.1573L7.9045 370.382L6.7753 368.1236L4.5169 362.4775L3.3876 359.0899L1.1292 347.7978L0 333.118L0 68.882L1.1292 54.2022L2.2584 47.427L3.3876 42.9101L5.6461 36.1348L10.1629 27.1011L12.4213 23.7135L23.7135 12.4213L27.1011 10.1629L32.7472 6.7753L38.3933 4.5169L41.7809 3.3876L46.2978 2.2584L51.9438 1.1292L60.9775 0ZM841.264 138.8933H841.264A18.0674 18.0674 0 0 1 859.3315 156.9607V245.0393A18.0674 18.0674 0 0 1 841.264 263.1067H841.264A18.0674 18.0674 0 0 1 823.1966 245.0393V156.9607A18.0674 18.0674 0 0 1 841.264 138.8933Z"
    },
    "occlusions": [
      {
        "kind": "rounded-rect",
        "left": 823.19663,
        "top": 138.893258,
        "width": 36.134831,
        "height": 124.213483,
        "radius": 18.067416
      }
    ]
  }
},
  "apple-iphone-17-pro-max-2025": {
  "portrait": {
    "left": 21.02458,
    "top": 17.31436,
    "width": 440.279431,
    "height": 956.0,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 65.5472L1.2367 55.6533L2.4735 49.4696L6.1837 38.3389L9.8939 30.9185L12.3674 27.2083L16.0776 22.2613L23.4981 14.8409L28.445 11.1307L34.6287 7.4204L40.8124 4.947L48.2329 2.4735L54.4166 1.2367L63.0737 0L377.2057 0L385.8629 1.2367L395.7568 3.7102L401.9405 6.1837L404.414 7.4204L410.5977 11.1307L418.0181 17.3144L421.7283 21.0246L426.6753 27.2083L431.6223 34.6287L432.859 37.1022L435.3325 43.2859L436.5692 46.9961L437.806 51.9431L439.0427 58.1268L440.2794 70.4942L440.2794 885.5058L439.0427 897.8732L437.806 904.0569L436.5692 909.0039L435.3325 912.7141L432.859 918.8978L431.6223 921.3713L426.6753 928.7917L420.4916 936.2122L419.2549 937.4489L413.0712 942.3959L405.6507 947.3428L403.1772 948.5796L396.9935 951.053L393.2833 952.2898L388.3364 953.5265L380.9159 954.7633L366.075 956L72.9677 956L58.1268 954.7633L51.9431 953.5265L46.9961 952.2898L39.5757 949.8163L29.6818 944.8693L25.9715 942.3959L13.6041 930.0285L11.1307 926.3182L7.4204 920.1345L4.947 913.9508L3.7102 910.2406L2.4735 905.2937L1.2367 899.11L0 889.216ZM171.2885 16.0776H268.9909A19.1695 19.1695 0 0 1 288.1604 35.2471V35.2471A19.1695 19.1695 0 0 1 268.9909 54.4166H171.2885A19.1695 19.1695 0 0 1 152.119 35.2471V35.2471A19.1695 19.1695 0 0 1 171.2885 16.0776Z"
    },
    "occlusions": [
      {
        "kind": "rounded-rect",
        "left": 152.119017,
        "top": 16.07762,
        "width": 136.041397,
        "height": 38.338939,
        "radius": 19.16947
      }
    ]
  },
  "landscape": {
    "left": 16.07762,
    "top": 21.02458,
    "width": 956.0,
    "height": 440.279431,
    "enableRotation": true,
    "paths": {
      "landscape": "M890.4528 0L900.3467 1.2367L906.5304 2.4735L917.6611 6.1837L925.0815 9.8939L928.7917 12.3674L933.7387 16.0776L941.1591 23.4981L944.8693 28.445L948.5796 34.6287L951.053 40.8124L953.5265 48.2329L954.7633 54.4166L956 63.0737L956 377.2057L954.7633 385.8629L952.2898 395.7568L949.8163 401.9405L948.5796 404.414L944.8693 410.5977L938.6856 418.0181L934.9754 421.7283L928.7917 426.6753L921.3713 431.6223L918.8978 432.859L912.7141 435.3325L909.0039 436.5692L904.0569 437.806L897.8732 439.0427L885.5058 440.2794L70.4942 440.2794L58.1268 439.0427L51.9431 437.806L46.9961 436.5692L43.2859 435.3325L37.1022 432.859L34.6287 431.6223L27.2083 426.6753L19.7878 420.4916L18.5511 419.2549L13.6041 413.0712L8.6572 405.6507L7.4204 403.1772L4.947 396.9935L3.7102 393.2833L2.4735 388.3364L1.2367 380.9159L0 366.075L0 72.9677L1.2367 58.1268L2.4735 51.9431L3.7102 46.9961L6.1837 39.5757L11.1307 29.6818L13.6041 25.9715L25.9715 13.6041L29.6818 11.1307L35.8655 7.4204L42.0492 4.947L45.7594 3.7102L50.7063 2.4735L56.89 1.2367L66.784 0ZM920.7529 152.119H920.7529A19.1695 19.1695 0 0 1 939.9224 171.2885V268.9909A19.1695 19.1695 0 0 1 920.7529 288.1604H920.7529A19.1695 19.1695 0 0 1 901.5834 268.9909V171.2885A19.1695 19.1695 0 0 1 920.7529 152.119Z"
    },
    "occlusions": [
      {
        "kind": "rounded-rect",
        "left": 901.583441,
        "top": 152.119017,
        "width": 38.338939,
        "height": 136.041397,
        "radius": 19.16947
      }
    ]
  }
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
  "portrait": {
    "left": 12.588889,
    "top": 11.444444,
    "width": 412.0,
    "height": 891.522222,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 26.3222L1.1444 21.7444L2.2889 18.3111L4.5778 13.7333L13.7333 4.5778L18.3111 2.2889L21.7444 1.1444L28.6111 0L383.3889 0L390.2556 1.1444L393.6889 2.2889L398.2667 4.5778L401.7 6.8667L406.2778 11.4444L408.5667 14.8778L409.7111 17.1667L412 24.0333L412 867.4889L410.8556 872.0667L408.5667 876.6444L406.2778 880.0778L400.5556 885.8L391.4 890.3778L385.6778 891.5222L27.4667 891.5222L21.7444 890.3778L18.3111 889.2333L13.7333 886.9444L9.1556 883.5111L8.0111 882.3667L4.5778 877.7889L2.2889 873.2111L1.1444 869.7778L0 865.2ZM206.5722 12.5889H206.5722A10.8722 10.8722 0 0 1 217.4444 23.4611V23.4611A10.8722 10.8722 0 0 1 206.5722 34.3333H206.5722A10.8722 10.8722 0 0 1 195.7 23.4611V23.4611A10.8722 10.8722 0 0 1 206.5722 12.5889Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 195.7,
        "top": 12.588889,
        "width": 21.744444,
        "height": 21.744444
      }
    ]
  },
  "landscape": {
    "left": 12.588889,
    "top": 12.588889,
    "width": 891.522222,
    "height": 412.0,
    "enableRotation": true,
    "paths": {
      "landscape": "M865.2 0L869.7778 1.1444L873.2111 2.2889L877.7889 4.5778L886.9444 13.7333L889.2333 18.3111L890.3778 21.7444L891.5222 28.6111L891.5222 383.3889L890.3778 390.2556L889.2333 393.6889L886.9444 398.2667L884.6556 401.7L880.0778 406.2778L876.6444 408.5667L874.3556 409.7111L867.4889 412L24.0333 412L19.4556 410.8556L14.8778 408.5667L11.4444 406.2778L5.7222 400.5556L1.1444 391.4L0 385.6778L0 27.4667L1.1444 21.7444L2.2889 18.3111L4.5778 13.7333L8.0111 9.1556L9.1556 8.0111L13.7333 4.5778L18.3111 2.2889L21.7444 1.1444L26.3222 0ZM868.0611 195.7H868.0611A10.8722 10.8722 0 0 1 878.9333 206.5722V206.5722A10.8722 10.8722 0 0 1 868.0611 217.4444H868.0611A10.8722 10.8722 0 0 1 857.1889 206.5722V206.5722A10.8722 10.8722 0 0 1 868.0611 195.7Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 857.188889,
        "top": 195.7,
        "width": 21.744444,
        "height": 21.744444
      }
    ]
  }
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
  "portrait": {
    "left": 21.811765,
    "top": 23.023529,
    "width": 412.0,
    "height": 924.576471,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 52.1059L1.2118 46.0471L2.4235 41.2L3.6353 37.5647L8.4824 27.8706L10.9059 24.2353L14.5412 19.3882L19.3882 14.5412L25.4471 9.6941L37.5647 3.6353L44.8353 1.2118L50.8941 0L361.1059 0L367.1647 1.2118L372.0118 2.4235L375.6471 3.6353L385.3412 8.4824L390.1882 12.1176L401.0941 23.0235L403.5176 26.6588L409.5765 38.7765L412 48.4706L412 876.1059L410.7882 880.9529L408.3647 888.2235L403.5176 897.9176L399.8824 902.7647L390.1882 912.4588L382.9176 917.3059L378.0706 919.7294L367.1647 923.3647L359.8941 924.5765L53.3176 924.5765L46.0471 923.3647L41.2 922.1529L37.5647 920.9412L27.8706 916.0941L24.2353 913.6706L18.1765 908.8235L15.7529 906.4L10.9059 900.3412L8.4824 896.7059L3.6353 887.0118L2.4235 883.3765L1.2118 878.5294L0 871.2588ZM206.6059 18.1765H206.6059A15.1471 15.1471 0 0 1 221.7529 33.3235V33.3235A15.1471 15.1471 0 0 1 206.6059 48.4706H206.6059A15.1471 15.1471 0 0 1 191.4588 33.3235V33.3235A15.1471 15.1471 0 0 1 206.6059 18.1765Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 191.458824,
        "top": 18.176471,
        "width": 30.294118,
        "height": 30.294118
      }
    ]
  },
  "landscape": {
    "left": 21.811765,
    "top": 21.811765,
    "width": 924.576471,
    "height": 412.0,
    "enableRotation": true,
    "paths": {
      "landscape": "M872.4706 0L878.5294 1.2118L883.3765 2.4235L887.0118 3.6353L896.7059 8.4824L900.3412 10.9059L905.1882 14.5412L910.0353 19.3882L914.8824 25.4471L920.9412 37.5647L923.3647 44.8353L924.5765 50.8941L924.5765 361.1059L923.3647 367.1647L922.1529 372.0118L920.9412 375.6471L916.0941 385.3412L912.4588 390.1882L901.5529 401.0941L897.9176 403.5176L885.8 409.5765L876.1059 412L48.4706 412L43.6235 410.7882L36.3529 408.3647L26.6588 403.5176L21.8118 399.8824L12.1176 390.1882L7.2706 382.9176L4.8471 378.0706L1.2118 367.1647L0 359.8941L0 53.3176L1.2118 46.0471L2.4235 41.2L3.6353 37.5647L8.4824 27.8706L10.9059 24.2353L15.7529 18.1765L18.1765 15.7529L24.2353 10.9059L27.8706 8.4824L37.5647 3.6353L41.2 2.4235L46.0471 1.2118L53.3176 0ZM891.2529 191.4588H891.2529A15.1471 15.1471 0 0 1 906.4 206.6059V206.6059A15.1471 15.1471 0 0 1 891.2529 221.7529H891.2529A15.1471 15.1471 0 0 1 876.1059 206.6059V206.6059A15.1471 15.1471 0 0 1 891.2529 191.4588Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 876.105882,
        "top": 191.458824,
        "width": 30.294118,
        "height": 30.294118
      }
    ]
  }
},
  "google-pixel-10-pro-2026": {
  "portrait": {
    "left": 17.774566,
    "top": 16.589595,
    "width": 410.0,
    "height": 913.612717,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 48.5838L1.185 41.474L3.5549 34.3642L8.2948 24.8844L10.6647 21.3295L21.3295 10.6647L24.8844 8.2948L34.3642 3.5549L37.9191 2.3699L42.659 1.185L50.9538 0L359.0462 0L368.526 1.185L379.1908 4.7399L383.9306 7.1098L387.4855 9.4798L392.2254 13.0347L398.1503 18.9595L401.7052 23.6994L405.2601 29.6243L406.4451 31.9942L408.815 39.104L410 43.8439L410 869.7688L408.815 874.5087L406.4451 881.6185L404.0751 886.3584L399.3353 893.4682L391.0405 901.763L383.9306 906.5029L376.8208 910.0578L373.2659 911.2428L368.526 912.4277L361.4162 913.6127L48.5838 913.6127L41.474 912.4277L34.3642 910.0578L24.8844 905.3179L21.3295 902.948L10.6647 892.2832L5.9249 885.1734L4.7399 882.8035L2.3699 876.8786L1.185 872.1387L0 866.2139ZM205.5925 17.7746H205.5925A13.6272 13.6272 0 0 1 219.2197 31.4017V31.4017A13.6272 13.6272 0 0 1 205.5925 45.0289H205.5925A13.6272 13.6272 0 0 1 191.9653 31.4017V31.4017A13.6272 13.6272 0 0 1 205.5925 17.7746Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 191.965318,
        "top": 17.774566,
        "width": 27.254335,
        "height": 27.254335
      }
    ]
  },
  "landscape": {
    "left": 17.774566,
    "top": 17.774566,
    "width": 913.612717,
    "height": 410.0,
    "enableRotation": true,
    "paths": {
      "landscape": "M865.0289 0L872.1387 1.185L879.2486 3.5549L888.7283 8.2948L892.2832 10.6647L902.948 21.3295L905.3179 24.8844L910.0578 34.3642L911.2428 37.9191L912.4277 42.659L913.6127 50.9538L913.6127 359.0462L912.4277 368.526L908.8728 379.1908L906.5029 383.9306L904.1329 387.4855L900.578 392.2254L894.6532 398.1503L889.9133 401.7052L883.9884 405.2601L881.6185 406.4451L874.5087 408.815L869.7688 410L43.8439 410L39.104 408.815L31.9942 406.4451L27.2543 404.0751L20.1445 399.3353L11.8497 391.0405L7.1098 383.9306L3.5549 376.8208L2.3699 373.2659L1.185 368.526L0 361.4162L0 48.5838L1.185 41.474L3.5549 34.3642L8.2948 24.8844L10.6647 21.3295L21.3295 10.6647L28.4393 5.9249L30.8092 4.7399L36.7341 2.3699L41.474 1.185L47.3988 0ZM882.211 191.9653H882.211A13.6272 13.6272 0 0 1 895.8382 205.5925V205.5925A13.6272 13.6272 0 0 1 882.211 219.2197H882.211A13.6272 13.6272 0 0 1 868.5838 205.5925V205.5925A13.6272 13.6272 0 0 1 882.211 191.9653Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 868.583816,
        "top": 191.965318,
        "width": 27.254335,
        "height": 27.254335
      }
    ]
  }
},
  "google-pixel-10-pro-fold-2026": {
  "portrait": {
    "left": 30.959538,
    "top": 25.00578,
    "width": 412.0,
    "height": 902.589595,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 47.6301L2.3815 38.104L4.763 32.1503L5.9538 29.7688L10.7168 22.6243L22.6243 10.7168L26.1965 8.3353L35.7225 3.5723L42.8671 1.1908L48.8208 0L363.1792 0L369.1329 1.1908L373.896 2.3815L379.8497 4.763L384.6127 7.1445L388.185 9.526L392.948 13.0983L400.0925 20.2428L404.8555 27.3873L409.6185 36.9133L410.8092 40.4855L412 45.2486L412 857.341L410.8092 862.104L409.6185 865.6763L404.8555 875.2023L400.0925 882.3468L392.948 889.4913L388.185 893.0636L384.6127 895.4451L379.8497 897.8266L373.896 900.2081L369.1329 901.3988L363.1792 902.5896L48.8208 902.5896L42.8671 901.3988L35.7225 899.0173L26.1965 894.2543L22.6243 891.8728L10.7168 879.9653L5.9538 872.8208L4.763 870.4393L2.3815 864.4855L0 854.9595ZM205.4046 17.8613H205.4046A12.5029 12.5029 0 0 1 217.9075 30.3642V30.3642A12.5029 12.5029 0 0 1 205.4046 42.8671H205.4046A12.5029 12.5029 0 0 1 192.9017 30.3642V30.3642A12.5029 12.5029 0 0 1 205.4046 17.8613Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 192.901734,
        "top": 17.861272,
        "width": 25.00578,
        "height": 25.00578
      }
    ]
  },
  "landscape": {
    "left": 25.00578,
    "top": 30.959538,
    "width": 902.589595,
    "height": 412.0,
    "enableRotation": true,
    "paths": {
      "landscape": "M854.9595 0L864.4855 2.3815L870.4393 4.763L872.8208 5.9538L879.9653 10.7168L891.8728 22.6243L894.2543 26.1965L899.0173 35.7225L901.3988 42.8671L902.5896 48.8208L902.5896 363.1792L901.3988 369.1329L900.2081 373.896L897.8266 379.8497L895.4451 384.6127L893.0636 388.185L889.4913 392.948L882.3468 400.0925L875.2023 404.8555L865.6763 409.6185L862.104 410.8092L857.341 412L45.2486 412L40.4855 410.8092L36.9133 409.6185L27.3873 404.8555L20.2428 400.0925L13.0983 392.948L9.526 388.185L7.1445 384.6127L4.763 379.8497L2.3815 373.896L1.1908 369.1329L0 363.1792L0 48.8208L1.1908 42.8671L3.5723 35.7225L8.3353 26.1965L10.7168 22.6243L22.6243 10.7168L29.7688 5.9538L32.1503 4.763L38.104 2.3815L47.6301 0ZM872.2254 192.9017H872.2254A12.5029 12.5029 0 0 1 884.7283 205.4046V205.4046A12.5029 12.5029 0 0 1 872.2254 217.9075H872.2254A12.5029 12.5029 0 0 1 859.7225 205.4046V205.4046A12.5029 12.5029 0 0 1 872.2254 192.9017Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 859.722543,
        "top": 192.901734,
        "width": 25.00578,
        "height": 25.00578
      }
    ]
  }
},
  "samsung-galaxy-a17-2025": {
  "portrait": {
    "left": 21.55814,
    "top": 21.55814,
    "width": 412.0,
    "height": 894.662791,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 32.3372L1.1977 27.5465L5.9884 17.9651L16.7674 7.186L26.3488 2.3953L31.1395 1.1977L39.5233 0L372.4767 0L380.8605 1.1977L385.6512 2.3953L392.8372 5.9884L396.4302 8.3837L404.814 16.7674L407.2093 20.3605L409.6047 25.1512L410.8023 28.7442L412 33.5349L412 862.3256L409.6047 869.5116L406.0116 876.6977L395.2326 887.4767L391.6395 889.8721L389.2442 891.0698L382.0581 893.4651L376.0698 894.6628L34.7326 894.6628L29.9419 893.4651L22.7558 891.0698L20.3605 889.8721L16.7674 887.4767L11.9767 883.8837L9.5814 881.4884L5.9884 876.6977L1.1977 867.1163L0 863.5233Z"
    }
  },
  "landscape": {
    "left": 41.918605,
    "top": 21.55814,
    "width": 894.662791,
    "height": 412.0,
    "enableRotation": true,
    "paths": {
      "landscape": "M862.3256 0L867.1163 1.1977L876.6977 5.9884L887.4767 16.7674L892.2674 26.3488L893.4651 31.1395L894.6628 39.5233L894.6628 372.4767L893.4651 380.8605L892.2674 385.6512L888.6744 392.8372L886.2791 396.4302L877.8953 404.814L874.3023 407.2093L869.5116 409.6047L865.9186 410.8023L861.1279 412L32.3372 412L25.1512 409.6047L17.9651 406.0116L7.186 395.2326L4.7907 391.6395L3.593 389.2442L1.1977 382.0581L0 376.0698L0 34.7326L1.1977 29.9419L3.593 22.7558L4.7907 20.3605L7.186 16.7674L10.7791 11.9767L13.1744 9.5814L17.9651 5.9884L27.5465 1.1977L31.1395 0Z"
    }
  }
},
  "motorola-razr-70-ultra-2026": {
  "portrait": {
    "left": 27.963012,
    "top": 27.963012,
    "width": 412.787318,
    "height": 1008.0,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 31.9577L1.3316 26.6314L2.6631 22.6367L5.3263 17.3104L7.9894 13.3157L14.6473 6.6579L25.2999 1.3316L30.6262 0L382.1612 0L387.4875 1.3316L398.14 6.6579L404.7979 13.3157L407.461 17.3104L410.1242 22.6367L411.4557 26.6314L412.7873 31.9577L412.7873 976.0423L411.4557 982.7001L406.1295 993.3527L398.14 1001.3421L394.1453 1004.0053L388.819 1006.6684L383.4927 1008L29.2946 1008L23.9683 1006.6684L18.642 1004.0053L14.6473 1001.3421L6.6579 993.3527L1.3316 982.7001L0 976.0423ZM207.0594 7.9894H205.7279A13.9815 13.9815 0 0 1 219.7094 21.9709V21.9709A13.9815 13.9815 0 0 1 205.7279 35.9524H207.0594A13.9815 13.9815 0 0 1 193.0779 21.9709V21.9709A13.9815 13.9815 0 0 1 207.0594 7.9894Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 193.077939,
        "top": 7.989432,
        "width": 26.63144,
        "height": 27.963012
      }
    ]
  },
  "landscape": {
    "left": 29.294584,
    "top": 27.963012,
    "width": 1008.0,
    "height": 412.787318,
    "enableRotation": true,
    "paths": {
      "landscape": "M976.0423 0L981.3686 1.3316L985.3633 2.6631L990.6896 5.3263L994.6843 7.9894L1001.3421 14.6473L1006.6684 25.2999L1008 30.6262L1008 382.1612L1006.6684 387.4875L1001.3421 398.14L994.6843 404.7979L990.6896 407.461L985.3633 410.1242L981.3686 411.4557L976.0423 412.7873L31.9577 412.7873L25.2999 411.4557L14.6473 406.1295L6.6579 398.14L3.9947 394.1453L1.3316 388.819L0 383.4927L0 29.2946L1.3316 23.9683L3.9947 18.642L6.6579 14.6473L14.6473 6.6579L25.2999 1.3316L31.9577 0ZM985.3633 193.0779H986.6948A13.3157 13.3157 0 0 1 1000.0106 206.3937V206.3937A13.3157 13.3157 0 0 1 986.6948 219.7094H985.3633A13.3157 13.3157 0 0 1 972.0476 206.3937V206.3937A13.3157 13.3157 0 0 1 985.3633 193.0779Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 972.047556,
        "top": 193.077939,
        "width": 27.963012,
        "height": 26.63144
      }
    ]
  }
},
  "infinix-hot-70-2026": {
  "portrait": {
    "left": 17.861333,
    "top": 22.064,
    "width": 360.378667,
    "height": 788.0,
    "enableRotation": true,
    "paths": {
      "portrait": "M0 35.7227L1.0507 30.4693L3.152 24.1653L5.2533 19.9627L7.3547 16.8107L16.8107 7.3547L19.9627 5.2533L26.2667 2.1013L29.4187 1.0507L34.672 0L325.7067 0L330.96 1.0507L334.112 2.1013L342.5173 6.304L347.7707 10.5067L349.872 12.608L353.024 16.8107L355.1253 19.9627L358.2773 26.2667L359.328 29.4187L360.3787 34.672L360.3787 753.328L359.328 758.5813L358.2773 761.7333L354.0747 770.1387L351.9733 773.2907L345.6693 779.5947L341.4667 782.7467L335.1627 785.8987L332.0107 786.9493L327.808 788L32.5707 788L28.368 786.9493L25.216 785.8987L21.0133 783.7973L14.7093 779.5947L9.456 774.3413L6.304 770.1387L2.1013 761.7333L1.0507 758.5813L0 753.328ZM180.1893 9.456H180.1893A11.032 11.032 0 0 1 191.2213 20.488V20.488A11.032 11.032 0 0 1 180.1893 31.52H180.1893A11.032 11.032 0 0 1 169.1573 20.488V20.488A11.032 11.032 0 0 1 180.1893 9.456Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 169.157333,
        "top": 9.456,
        "width": 22.064,
        "height": 22.064
      }
    ]
  },
  "landscape": {
    "left": 30.469333,
    "top": 17.861333,
    "width": 788.0,
    "height": 360.378667,
    "enableRotation": true,
    "paths": {
      "landscape": "M752.2773 0L757.5307 1.0507L763.8347 3.152L768.0373 5.2533L771.1893 7.3547L780.6453 16.8107L782.7467 19.9627L785.8987 26.2667L786.9493 29.4187L788 34.672L788 325.7067L786.9493 330.96L785.8987 334.112L781.696 342.5173L777.4933 347.7707L775.392 349.872L771.1893 353.024L768.0373 355.1253L761.7333 358.2773L758.5813 359.328L753.328 360.3787L34.672 360.3787L29.4187 359.328L26.2667 358.2773L17.8613 354.0747L14.7093 351.9733L8.4053 345.6693L5.2533 341.4667L2.1013 335.1627L1.0507 332.0107L0 327.808L0 32.5707L1.0507 28.368L2.1013 25.216L4.2027 21.0133L8.4053 14.7093L13.6587 9.456L17.8613 6.304L26.2667 2.1013L29.4187 1.0507L34.672 0ZM767.512 169.1573H767.512A11.032 11.032 0 0 1 778.544 180.1893V180.1893A11.032 11.032 0 0 1 767.512 191.2213H767.512A11.032 11.032 0 0 1 756.48 180.1893V180.1893A11.032 11.032 0 0 1 767.512 169.1573Z"
    },
    "occlusions": [
      {
        "kind": "circle",
        "left": 756.48,
        "top": 169.157333,
        "width": 22.064,
        "height": 22.064
      }
    ]
  }
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
  "samsung-galaxy-s26-2026": {
    portrait: {
      left: 9, top: 8.5, width: 351.5, height: 772.5, enableRotation: true,
      occlusions: [{ kind: "circle", left: 169, top: 9, width: 17, height: 17 }],
    },
    landscape: {
      left: 7.5, top: 9, width: 772.5, height: 351.5, enableRotation: true,
      occlusions: [{ kind: "circle", left: 746.5, top: 169, width: 17, height: 17 }],
    },
  },
  "samsung-galaxy-z-fold7-unfolded-2025": {
    portrait: {
      left: 17.5, top: 16, width: 884, height: 811, enableRotation: false,
      occlusions: [
        // The crease is touchable display, not a hardware cutout.
        { kind: "circle", left: 582, top: 19, width: 16, height: 16 },
      ],
    },
  },
  "samsung-galaxy-z-fold8-folded-2026": {
    portrait: {
      left: 28.5, top: 23.5, width: 395, height: 624, cornerRadius: 7, enableRotation: false,
      occlusions: [{ kind: "circle", left: 188.5, top: 9.5, width: 18, height: 18 }],
    },
  },
  "samsung-galaxy-z-fold8-unfolded-2026": {
    portrait: {
      left: 21, top: 23, width: 956, height: 720, cornerRadius: 7, enableRotation: false,
      occlusions: [{ kind: "circle", left: 711.25, top: 17.4, width: 19, height: 19 }],
    },
  },
  "samsung-galaxy-z-fold8-ultra-folded-2026": {
    portrait: {
      left: 28, top: 24, width: 345, height: 803, cornerRadius: 8, enableRotation: false,
      occlusions: [{ kind: "circle", left: 163, top: 10, width: 19, height: 19 }],
    },
  },
  "samsung-galaxy-z-fold8-ultra-unfolded-2026": {
    portrait: {
      left: 25, top: 26, width: 877, height: 976, cornerRadius: 7, enableRotation: false,
      occlusions: [{ kind: "circle", left: 648, top: 19, width: 20, height: 20 }],
    },
  },
  "samsung-galaxy-z-flip8-folded-2026": {
    portrait: {
      left: 16, top: 28, width: 304, height: 336, enableRotation: false,
      paths: {
        portrait: "M4 0H300Q304 0 304 4V320Q304 336 288 336H16Q0 336 0 320V4Q0 0 4 0ZM147 297A10 10 0 1 0 167 297A10 10 0 1 0 147 297ZM178 297A26 26 0 1 0 230 297A26 26 0 1 0 178 297ZM239 297A26 26 0 1 0 291 297A26 26 0 1 0 239 297Z",
      },
      occlusions: [
        { kind: "circle", left: 147, top: 287, width: 20, height: 20 },
        { kind: "circle", left: 178, top: 271, width: 52, height: 52 },
        { kind: "circle", left: 239, top: 271, width: 52, height: 52 },
      ],
    },
  },
  "samsung-galaxy-z-flip8-unfolded-2026": {
    portrait: {
      left: 22, top: 21, width: 349, height: 807, enableRotation: false,
      occlusions: [{ kind: "circle", left: 163, top: 10, width: 20, height: 20 }],
    },
  },
  "samsung-galaxy-a27-5g-2026": {
    portrait: {
      left: 24, top: 25, width: 344, height: 745, cornerRadius: 31, enableRotation: true,
      occlusions: [{ kind: "circle", left: 163, top: 9, width: 18, height: 18 }],
    },
  },
  "modern-laptop-15": {
    portrait: {
      // The raster aperture ends at y=878 (half of the source image). Fit the
      // 16:10 CSS viewport inside it, centered, without covering the bezel.
      left: 178.8, top: 34, width: 1350.4, height: 844, enableRotation: false,
    },
  },
  "apple-iphone-16-pro-2024": {
    portrait: { left: 19, top: 15, width: 402, height: 874, enableRotation: true },
    landscape: { left: 15, top: 19, width: 874, height: 402, enableRotation: true },
  },
  "apple-iphone-17e-2026": {
    portrait: {
      left: 25.2, top: 20.4, width: 367.2, height: 799.2, cornerRadius: 47, enableRotation: true,
    },
    landscape: {
      left: 20.4, top: 25.2, width: 799.2, height: 367.2, cornerRadius: 47, enableRotation: true,
    },
  },
  "apple-ipad-pro-13-m4-2024": {
    portrait: { left: 55, top: 50.5, width: 1032, height: 1376, cornerRadius: 26, enableRotation: true },
    landscape: { left: 53.5, top: 55, width: 1376, height: 1032, cornerRadius: 26, enableRotation: true },
  },
  "apple-ipad-air-13-m4-2026": {
    portrait: { left: 59, top: 55, width: 1024, height: 1366, enableRotation: true },
    landscape: { left: 55, top: 59, width: 1366, height: 1024, enableRotation: true },
  },
  "apple-ipad-mini-a17-pro-2024": {
    portrait: { left: 60, top: 85, width: 744, height: 1133, enableRotation: true },
    landscape: { left: 85, top: 60, width: 1133, height: 744, enableRotation: true },
  },
  "apple-macbook-air-13-m4-2025": {
    portrait: { left: 183, top: 54, width: 1280, height: 800, enableRotation: false },
  },
  "apple-macbook-pro-14-m5-2025": {
    // This shared artwork needs its own 14-inch screen opening. Reusing the
    // 16-inch rectangle letterboxed the toolbar and page inside a white surface.
    portrait: { left: 197, top: 40, width: 1728, height: 1728 * 982 / 1512, cornerRadius: 8, enableRotation: false },
  },
  "samsung-galaxy-s26-plus-2026": {
    portrait: {
      left: 26, top: 32, width: 492, height: 1058, cornerRadius: 58, enableRotation: true,
      occlusions: [{ kind: "circle", left: 232, top: 12, width: 28, height: 28 }],
    },
    landscape: {
      left: 32, top: 26, width: 1058, height: 492, cornerRadius: 58, enableRotation: true,
      occlusions: [{ kind: "circle", left: 1018, top: 232, width: 28, height: 28 }],
    },
  },
  "samsung-galaxy-z-flip7-2025": {
    portrait: {
      left: 17, top: 24, width: 360, height: 840, enableRotation: true,
      occlusions: [{ kind: "circle", left: 174, top: 12, width: 12, height: 12 }],
    },
    landscape: {
      left: 28.5, top: 17, width: 840, height: 360, enableRotation: true,
      occlusions: [{ kind: "circle", left: 816, top: 174, width: 12, height: 12 }],
    },
  },
  "samsung-galaxy-tab-s11-ultra-2025": {
    portrait: {
      left: 36, top: 38.5, width: 940, height: 1481, enableRotation: true,
      occlusions: [{ kind: "rounded-rect", left: 0, top: 718, width: 20, height: 46, radius: 10 }],
    },
    landscape: {
      left: 39, top: 36, width: 1481, height: 940, enableRotation: true,
      occlusions: [{ kind: "rounded-rect", left: 717, top: 0, width: 46, height: 20, radius: 10 }],
    },
  },
  "google-pixel-10a-2026": {
    portrait: {
      left: 20, top: 20, width: 324, height: 727, cornerRadius: 44, enableRotation: true,
      occlusions: [{ kind: "circle", left: 152, top: 15, width: 20, height: 20 }],
    },
    landscape: {
      left: 20, top: 20, width: 727, height: 324, cornerRadius: 44, enableRotation: true,
      occlusions: [{ kind: "circle", left: 692, top: 152, width: 20, height: 20 }],
    },
  },
  "motorola-razr-60-ultra-2025": {
    portrait: { left: 28, top: 28, width: 412, height: 1008, enableRotation: true },
    landscape: { left: 28, top: 28, width: 1008, height: 412, enableRotation: true },
  },
  "zebra-tc58-2022": {
    portrait: { left: 36.5, top: 65.5, width: 418.5, height: 823.5, enableRotation: true },
    landscape: { left: 58.5, top: 36.5, width: 823.5, height: 418.5, enableRotation: true },
  },
  "honeywell-ct47-2023": {
    portrait: { left: 36.5, top: 65.5, width: 418.5, height: 823.5, enableRotation: true },
    landscape: { left: 58.5, top: 36.5, width: 823.5, height: 418.5, enableRotation: true },
  },
  "panasonic-toughbook-s1-2021": {
    portrait: { left: 107, top: 110.5, width: 533, height: 853, enableRotation: true },
    landscape: { left: 105.5, top: 107, width: 853, height: 533, enableRotation: true },
  },
  "microsoft-surface-laptop-7-2024": {
    portrait: {
      left: 134.02, top: 7.86, width: 1440, height: 900, enableRotation: false,
      occlusions: [{ kind: "circle", left: 712, top: 0, width: 16, height: 16 }],
    },
  },
  "dell-xps-13-9350-2024": {
    portrait: {
      left: 134.02, top: 7.86, width: 1440, height: 900, enableRotation: false,
      occlusions: [{ kind: "circle", left: 712, top: 0, width: 16, height: 16 }],
    },
  },
  "apple-macbook-neo-13-2026": {
  "portrait": {
    "left": 146.104478,
    "top": 41.208955,
    "width": 1206.298507,
    "height": 753.0,
    "enableRotation": false,
    "paths": {
      "portrait": "M0 11.2388L1.8731 7.4925L7.4925 1.8731L11.2388 0L1195.0597 0L1198.806 1.8731L1204.4254 7.4925L1206.2985 11.2388L1206.2985 753L0 753Z"
    }
  }
},
  "microsoft-surface-laptop-8-13-8-2026": {
    // Source-image display: x=268..1122, y=298..874, relative to the crop.
    portrait: { left: 208, top: 48, width: 854, height: 576, cornerRadius: 4, enableRotation: false },
  },
  "apple-studio-display-xdr-27-2026": {
    portrait: { left: 99, top: 90, width: 503, height: 289, cornerRadius: 4, enableRotation: false },
  },
};

const aliases: Record<string, string> = {
  "motorola-razr-60-ultra-2025": "motorola-razr-70-ultra-2026",
  "apple-iphone-14": "apple-iphone-14-2022",
  "apple-iphone-15": "apple-iphone-15-2023",
  "apple-iphone-13-mini": "apple-iphone-13-mini-2021",
  "apple-iphone-se-2018": "apple-iphone-se",
  "samsung-galaxy-s24": "samsung-galaxy-s24-2024",
  "samsung-galaxy-s24-ultra": "samsung-galaxy-s24-ultra-2024",
  "google-pixel-8": "google-pixel-8-2024",
  "samsung-galaxy-z-fold-2": "samsung-galaxy-fold2",
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
  // Both modern minis use the same SVG shell; OS metadata remains per device.
  const lookupId = deviceId === "apple-ipad-mini-6" ? "apple-ipad-mini-a17-pro-2024" : resolveMockupId(deviceId);
  const asset = localMockupCatalog.find((candidate) => candidate.id === lookupId);
  if (!asset) return [];
  const viewportId = asset.viewportSourceId ?? lookupId;
  return [{
    kind: asset.localPath.endsWith(".svg") ? "transparent-svg" : "transparent-png",
    localPath: asset.localPath,
    width: asset.width,
    height: asset.height,
    renderScale: asset.renderScale,
    previewScale: asset.previewScale,
    frameOverlay: asset.frameOverlay,
    sourceCrop: asset.sourceCrop,
    screenInset: asset.screenInset,
    viewport: asset.viewport ?? mockupViewportConfigs[viewportId],
    cssViewport: asset.cssViewport,
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
   * Present for devices with a measured inset; otherwise generation constants are used.
   */
  safeAreaInsetTop?: number;
  /** Additional left padding for status-bar clocks that would overlap an off-centre camera. */
  statusBarInsetLeft?: number;
  /** Additional right padding for status icons that would overlap an off-centre camera. */
  statusBarInsetRight?: number;
  devicePixelRatio?: number;
  isPro?: boolean;
}

export function getDeviceChromeMeta(deviceId: string): DeviceChromeMeta | undefined {
  return deviceChromeMeta[resolveMockupId(deviceId)];
}

export const deviceChromeMeta: Record<string, DeviceChromeMeta> = {
  // New-device safe areas are presentation estimates pending native Safari validation.
  "apple-iphone-18-pro-2026": { osName: "iOS", osVersion: "27.0", notch: false, devicePixelRatio: 3 },
  "apple-iphone-18-pro-max-2026": { osName: "iOS", osVersion: "27.0", notch: false, devicePixelRatio: 3 },
  "apple-iphone-duo-folded-2026": { osName: "iOS", osVersion: "27.0", notch: false, devicePixelRatio: 3, safeAreaInsetTop: 64, statusBarInsetRight: 64 },
  "apple-iphone-duo-unfolded-2026": { osName: "iOS", osVersion: "27.0", notch: false, devicePixelRatio: 3 },
  "apple-watch-serie-6": { osName: "watchOS", osVersion: "7.0", notch: false, devicePixelRatio: 2 },
  "samsung-galaxy-s20": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 36 },
  "xiaomi-mi-11i": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 33 },
  "huawei-p30-pro": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 28 },
  "google-pixel-5": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 49 },
  "oneplus-nord-2": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2.625, isPro: false, safeAreaInsetTop: 50, statusBarInsetLeft: 30 },
  "samsung-galaxy-fold2": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, isPro: false, safeAreaInsetTop: 28 },
  "apple-iphone-5": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-iphone-se": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-iphone-x": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false },
  "apple-iphone-xr": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-ipad-mini-6": { osName: "iPadOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-ipad-air-4": { osName: "iPadOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "apple-ipad-pro-11-2018": { osName: "iPadOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false },
  "samsung-galaxy-tab-s7": { osName: "Android", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false, safeAreaInsetTop: 28 },
  "macbook-air": { osName: "macOS", osVersion: "11.0", notch: false, devicePixelRatio: 2, isPro: false },
  "dell-latitude-14-3420": { osName: "Windows", osVersion: "11.0", notch: false, devicePixelRatio: 1, isPro: true },
  "apple-iphone-11": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 2, isPro: false, safeAreaInsetTop: 44 },
  "apple-iphone-11-pro": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 44 },
  "apple-iphone-11-pro-max": { osName: "iOS", osVersion: "14.0", notch: false, devicePixelRatio: 3, isPro: false, safeAreaInsetTop: 44 },
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
  "google-pixel-10-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2.625, safeAreaInsetTop: 54 },
  "google-pixel-10-pro-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3.125, isPro: true, safeAreaInsetTop: 50 },
  "google-pixel-10-pro-fold-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2.625, isPro: true, safeAreaInsetTop: 48 },
  "google-pixel-11-2026": { osName: "Android", osVersion: "17.0", notch: false, devicePixelRatio: 2.625, safeAreaInsetTop: 36 },
  "google-pixel-11-pro-2026": { osName: "Android", osVersion: "17.0", notch: false, devicePixelRatio: 3.125, isPro: true, safeAreaInsetTop: 36 },
  "google-pixel-11-pro-xl-2026": { osName: "Android", osVersion: "17.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 36 },
  "google-pixel-11-pro-fold-2026": { osName: "Android", osVersion: "17.0", notch: false, devicePixelRatio: 2.625, isPro: true, safeAreaInsetTop: 28, statusBarInsetRight: 44 },
  "samsung-galaxy-a17-2025": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2.625, safeAreaInsetTop: 36 },
  "motorola-razr-70-ultra-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 40 },
  "infinix-hot-70-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, safeAreaInsetTop: 36 },
  "samsung-galaxy-s26-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 36 },
  "samsung-galaxy-z-fold7-unfolded-2025": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2.5, isPro: true, safeAreaInsetTop: 28 },
  "google-pixel-10-pro-xl-2025": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 36 },
  "modern-laptop-15": { osName: "Windows", osVersion: "11.0", notch: false, devicePixelRatio: 1, isPro: true },
  "apple-imac-24-inch-2021": { osName: "macOS", osVersion: "15.3", notch: false, devicePixelRatio: 2, isPro: true },
  "samsung-smart-tv": { osName: "Android", osVersion: "12.0", notch: false, devicePixelRatio: 1, isPro: true, safeAreaInsetTop: 28 },
  "self-service-kiosk": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 1, isPro: true, safeAreaInsetTop: 28 },
  "zebra-mc330": { osName: "Android", osVersion: "10.0", notch: false, devicePixelRatio: 1, isPro: true, safeAreaInsetTop: 28 },
  "zebra-tc78": { osName: "Android", osVersion: "13.0", notch: false, devicePixelRatio: 2, isPro: true, safeAreaInsetTop: 28 },
  "sonoff-nspanel-pro": { osName: "Android", osVersion: "8.1.0", notch: false, devicePixelRatio: 1, isPro: true, safeAreaInsetTop: 28 },
  "non-branded-android-smartphone": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 28 },
  "apple-iphone-16-pro-2024": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3, isPro: true },
  "apple-iphone-16e-2025": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-iphone-17e-2026": { osName: "iOS", osVersion: "26.0", notch: true, safeAreaInsetBottom: 90, devicePixelRatio: 3 },
  "apple-ipad-pro-13-m4-2024": { osName: "iPadOS", osVersion: "26.0", notch: false, devicePixelRatio: 2, isPro: true },
  "apple-ipad-air-13-m4-2026": { osName: "iPadOS", osVersion: "26.0", notch: false, devicePixelRatio: 2, isPro: true },
  "apple-ipad-mini-a17-pro-2024": { osName: "iPadOS", osVersion: "26.0", notch: false, devicePixelRatio: 2, isPro: true },
  "apple-macbook-air-13-m4-2025": { osName: "macOS", osVersion: "26.0", notch: true, devicePixelRatio: 2, isPro: true },
  "apple-macbook-pro-14-m5-2025": { osName: "macOS", osVersion: "26.0", notch: true, devicePixelRatio: 2, isPro: true },
  "samsung-galaxy-s26-plus-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3.75, isPro: true, safeAreaInsetTop: 36 },
  "samsung-galaxy-z-flip7-2025": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 36 },
  "samsung-galaxy-tab-s11-ultra-2025": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2, isPro: true, safeAreaInsetTop: 28 },
  "samsung-galaxy-xcover7-pro-2025": { osName: "Android", osVersion: "15.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 36 },
  "google-pixel-10a-2026": { osName: "Android", osVersion: "16.0", notch: false, devicePixelRatio: 2.625, safeAreaInsetTop: 36 },
  "motorola-edge-60-pro-2025": { osName: "Android", osVersion: "15.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 36 },
  "motorola-thinkphone-25-2024": { osName: "Android", osVersion: "15.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 36 },
  "motorola-razr-60-ultra-2025": { osName: "Android", osVersion: "15.0", notch: false, devicePixelRatio: 3, isPro: true, safeAreaInsetTop: 36 },
  "zebra-tc58-2022": { osName: "Android", osVersion: "13.0", notch: false, devicePixelRatio: 2.625, isPro: true, safeAreaInsetTop: 28 },
  "honeywell-ct47-2023": { osName: "Android", osVersion: "13.0", notch: false, devicePixelRatio: 2.625, isPro: true, safeAreaInsetTop: 28 },
  "panasonic-toughbook-s1-2021": { osName: "Android", osVersion: "11.0", notch: false, devicePixelRatio: 1.5, isPro: true, safeAreaInsetTop: 28 },
  "microsoft-surface-laptop-7-2024": { osName: "Windows", osVersion: "11.0", notch: false, devicePixelRatio: 1, isPro: true },
  "dell-xps-13-9350-2024": { osName: "Windows", osVersion: "11.0", notch: false, devicePixelRatio: 1, isPro: true },
  "apple-macbook-neo-13-2026": { osName: "macOS", osVersion: "26.0", notch: false, devicePixelRatio: 2 },
  "microsoft-surface-laptop-8-13-8-2026": { osName: "Windows", osVersion: "11.0", notch: false, devicePixelRatio: 2, isPro: true },
  "apple-studio-display-xdr-27-2026": { osName: "macOS", osVersion: "26.0", notch: false, devicePixelRatio: 2, isPro: true },
};
