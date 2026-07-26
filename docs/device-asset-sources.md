# Device asset sources

Device frames must come from a manufacturer-owned product or press source. Do not use a generic frame for a named device and do not use generated artwork.

The derived PNGs below only crop the official front render, isolate it from any companion rear render, scale it for the simulator, and remove the studio background. The product body, bezel, hinge, buttons, cameras, and display proportions are not redrawn.

## Samsung 2026 devices

Geometry reference: [Samsung Galaxy Z Fold8 Ultra, Fold8 and Flip8 specifications](https://news.samsung.com/global/samsung-galaxy-z-fold8-ultra-fold8-and-flip8foldables-perfected-for-every-way-of-living)

| Simulator asset | Official collection | Official source file | SHA-256 |
| --- | --- | --- | --- |
| `samsung-galaxy-z-fold8-folded.png` | [Galaxy Z Fold8](https://www.samsungmobilepress.com/media-assets/galaxy-z-fold8) | `016-galaxy-zfold8-graphite-front.jpg` | `a04cf8fb437cd63d8b5d7f68bb7c72f4c6a4893e7b102746ba79ba04256d1956` |
| `samsung-galaxy-z-fold8-unfolded.png` | [Galaxy Z Fold8](https://www.samsungmobilepress.com/media-assets/galaxy-z-fold8) | `018-galaxy-zfold8-graphite-open-front.jpg` | `3b3b9219a6fac97018ccf2c1f705d7797d7648f07f793187bae491cd738e98e6` |
| `samsung-galaxy-z-fold8-ultra-folded.png` | [Galaxy Z Fold8 Ultra](https://www.samsungmobilepress.com/media-assets/galaxy-z-fold8-ultra) | `003-product-galaxy-zfold8-ultra-violetshadow-front.jpg` | `4bee092c6b11d64a6929b52a746cb937a97e41401f0affd9f6b1790aab3658b5` |
| `samsung-galaxy-z-fold8-ultra-unfolded.png` | [Galaxy Z Fold8 Ultra](https://www.samsungmobilepress.com/media-assets/galaxy-z-fold8-ultra) | `006-product-galaxy-zfold8-ultra-violetshadow-open-front.jpg` | `c843df7c862ab8a116523cc1571673666e2ff596f75389e3e260fd6bb0af1176` |
| `samsung-galaxy-z-flip8-folded.png` | [Galaxy Z Flip8](https://www.samsungmobilepress.com/media-assets/galaxy-z-flip8) | `013-galaxy-zflip8-graphite-closed-front.jpg` | `c0b773f5d1b25d2d818b2aa4022c97a5615dafe415128bf61edaa8bc716a18c2` |
| `samsung-galaxy-z-flip8-unfolded.png` | [Galaxy Z Flip8](https://www.samsungmobilepress.com/media-assets/galaxy-z-flip8) | `018-galaxy-zflip8-graphite-open-front.jpg` | `dd479e03daff7f801e98295265b5894de4f29820032a637ef56831bca5261869` |
| `samsung-galaxy-a27-5g.png` | [Galaxy A27 5G](https://www.samsungmobilepress.com/media-assets/galaxy-a27-5g) | `002-product-galaxy-a27-5g-black-front2.jpg` | `a33dd394c517b01cfc77a6031b0d8570e3bd88aae4b3788295f09023601f8c96` |

The Fold8 and Fold8 Ultra main-display camera holes are deliberately offset to the right, matching the official open-front renders. Their cover-display camera holes remain centered. The Flip8 folded preset also masks the two camera lenses and flash from the usable cover viewport.
