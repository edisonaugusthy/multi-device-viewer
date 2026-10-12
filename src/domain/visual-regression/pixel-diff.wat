;; Pixel comparison for "before" and "after" captures. The JS wrapper lays out
;; every buffer in this module's memory and copies results out before the next
;; call. Uses WebAssembly SIMD, bulk memory and multi-value, which every Chrome
;; that allows extension WebAssembly at all ('wasm-unsafe-eval', Chrome 103+)
;; supports.
;;
;; diff:    1. Composite both captures on white and compare each pixel with a
;;             perceptual colour difference in YIQ space (as pixelmatch does):
;;             changed when 0.5053·ΔY² + 0.299·ΔI² + 0.1957·ΔQ² > maxDelta.
;;             Writes one mark byte per pixel and a count per 8×8 cell. Sixteen
;;             identical pixels are skipped per step; differing pixels are
;;             compared four at a time in f32 lanes.
;;          2. When asked, unmarks anti-aliasing: a marked pixel that sits on
;;             an intensity slope in either capture (one darker and one
;;             brighter neighbour, and that neighbour has three identical
;;             siblings in both captures). Only cells that are partly changed
;;             are examined: a fully changed cell is a real change, and so is
;;             a page where more than an eighth of the pixels differ.
;;          3. Recounts each touched cell from its marks and records the exact
;;             pixel bounds of its changes.
;; regions: group changed cells within `radius` cells of each other and write
;;          [minX, minY, maxX, maxY, pixels] per region in pixel coordinates,
;;          marking each claimed cell in place (high bit of its count).
;; pack:    one bit per changed cell, least significant bit first, so the UI
;;          can draw the overlay without a full-size mask image.
;;
;; Cell record (8 bytes): count as u32, then minX, minY, maxX, maxY as u8
;; offsets inside the cell. Marks are 0xFF (changed) or 0, one byte per pixel,
;; and the marks buffer has 16 bytes of padding after the last pixel.
(module
  (memory (export "memory") 1 1024)

  ;; Y, I and Q of four pixels, composited on white, as f32 lanes.
  (func $yiq (param $v v128) (result v128 v128 v128)
    (local $r v128) (local $g v128) (local $b v128) (local $a v128)
    (local.set $a (f32x4.mul
      (f32x4.convert_i32x4_u (i8x16.shuffle 3 16 16 16 7 16 16 16 11 16 16 16 15 16 16 16 (local.get $v) (v128.const i8x16 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)))
      (v128.const f32x4 0.00392156862745098 0.00392156862745098 0.00392156862745098 0.00392156862745098)))
    ;; blend(c) = 255 + (c − 255)·α, exact for opaque pixels.
    (local.set $r (f32x4.add (v128.const f32x4 255 255 255 255) (f32x4.mul (f32x4.sub
      (f32x4.convert_i32x4_u (i8x16.shuffle 0 16 16 16 4 16 16 16 8 16 16 16 12 16 16 16 (local.get $v) (v128.const i8x16 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)))
      (v128.const f32x4 255 255 255 255)) (local.get $a))))
    (local.set $g (f32x4.add (v128.const f32x4 255 255 255 255) (f32x4.mul (f32x4.sub
      (f32x4.convert_i32x4_u (i8x16.shuffle 1 16 16 16 5 16 16 16 9 16 16 16 13 16 16 16 (local.get $v) (v128.const i8x16 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)))
      (v128.const f32x4 255 255 255 255)) (local.get $a))))
    (local.set $b (f32x4.add (v128.const f32x4 255 255 255 255) (f32x4.mul (f32x4.sub
      (f32x4.convert_i32x4_u (i8x16.shuffle 2 16 16 16 6 16 16 16 10 16 16 16 14 16 16 16 (local.get $v) (v128.const i8x16 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0)))
      (v128.const f32x4 255 255 255 255)) (local.get $a))))
    (f32x4.add (f32x4.add
      (f32x4.mul (local.get $r) (v128.const f32x4 0.29889531 0.29889531 0.29889531 0.29889531))
      (f32x4.mul (local.get $g) (v128.const f32x4 0.58662247 0.58662247 0.58662247 0.58662247)))
      (f32x4.mul (local.get $b) (v128.const f32x4 0.11448223 0.11448223 0.11448223 0.11448223)))
    (f32x4.sub (f32x4.sub
      (f32x4.mul (local.get $r) (v128.const f32x4 0.59597799 0.59597799 0.59597799 0.59597799))
      (f32x4.mul (local.get $g) (v128.const f32x4 0.27417610 0.27417610 0.27417610 0.27417610)))
      (f32x4.mul (local.get $b) (v128.const f32x4 0.32180189 0.32180189 0.32180189 0.32180189)))
    (f32x4.add (f32x4.sub
      (f32x4.mul (local.get $r) (v128.const f32x4 0.21147017 0.21147017 0.21147017 0.21147017))
      (f32x4.mul (local.get $g) (v128.const f32x4 0.52261711 0.52261711 0.52261711 0.52261711)))
      (f32x4.mul (local.get $b) (v128.const f32x4 0.31114694 0.31114694 0.31114694 0.31114694))))

  ;; Changed-pixel count (0–4) for the four pixels at $a and $b, writing their
  ;; marks. $keep drops the bits of pixels that lie past the end of a row (the
  ;; marks written for them are overwritten by the next row, or land in the
  ;; padding). Identical groups return early, so a block with one changed
  ;; pixel only compares that pixel's group.
  (func $group (param $a i32) (param $b i32) (param $marks i32) (param $max v128) (param $keep i32) (result i32)
    (local $va v128) (local $vb v128) (local $ya v128) (local $ia v128) (local $qa v128) (local $yb v128) (local $ib v128) (local $qb v128)
    (local $d v128) (local $delta v128) (local $changed v128)
    (local.set $va (v128.load (local.get $a)))
    (local.set $vb (v128.load (local.get $b)))
    (if (i8x16.all_true (i8x16.eq (local.get $va) (local.get $vb))) (then (return (i32.const 0))))
    (call $yiq (local.get $va)) (local.set $qa) (local.set $ia) (local.set $ya)
    (call $yiq (local.get $vb)) (local.set $qb) (local.set $ib) (local.set $yb)
    (local.set $d (f32x4.sub (local.get $ya) (local.get $yb)))
    (local.set $delta (f32x4.mul (f32x4.mul (local.get $d) (local.get $d)) (v128.const f32x4 0.5053 0.5053 0.5053 0.5053)))
    (local.set $d (f32x4.sub (local.get $ia) (local.get $ib)))
    (local.set $delta (f32x4.add (local.get $delta) (f32x4.mul (f32x4.mul (local.get $d) (local.get $d)) (v128.const f32x4 0.299 0.299 0.299 0.299))))
    (local.set $d (f32x4.sub (local.get $qa) (local.get $qb)))
    (local.set $delta (f32x4.add (local.get $delta) (f32x4.mul (f32x4.mul (local.get $d) (local.get $d)) (v128.const f32x4 0.1957 0.1957 0.1957 0.1957))))
    (local.set $changed (f32x4.gt (local.get $delta) (local.get $max)))
    (i32.store (local.get $marks) (i32x4.extract_lane 0
      (i8x16.narrow_i16x8_s (i16x8.narrow_i32x4_s (local.get $changed) (local.get $changed)) (local.get $changed))))
    (i32.popcnt (i32.and (i32x4.bitmask (local.get $changed)) (local.get $keep))))

  ;; Brightness of a composited pixel, scaled by 1024. Screenshots are almost
  ;; always opaque, so that case reads the pixel once and skips the blend:
  ;; (c·α + 127) / 255 + 255 − α, with (x + (x >> 8) + 1) >> 8 as floor(x / 255).
  (func $luma (param $p i32) (result i32)
    (local $v i32) (local $alpha i32) (local $x i32) (local $sum i32) (local $channel i32)
    (local.set $v (i32.load (local.get $p)))
    (local.set $alpha (i32.shr_u (local.get $v) (i32.const 24)))
    (if (i32.eq (local.get $alpha) (i32.const 255))
      (then (return (i32.add (i32.add
        (i32.mul (i32.and (local.get $v) (i32.const 255)) (i32.const 306))
        (i32.mul (i32.and (i32.shr_u (local.get $v) (i32.const 8)) (i32.const 255)) (i32.const 601)))
        (i32.mul (i32.and (i32.shr_u (local.get $v) (i32.const 16)) (i32.const 255)) (i32.const 117))))))
    (local.set $channel (i32.const 0))
    (loop $channels
      (local.set $x (i32.add (i32.mul (i32.and (i32.shr_u (local.get $v) (i32.mul (local.get $channel) (i32.const 8))) (i32.const 255)) (local.get $alpha)) (i32.const 127)))
      (local.set $sum (i32.add (local.get $sum) (i32.mul
        (i32.add (i32.shr_u (i32.add (i32.add (local.get $x) (i32.shr_u (local.get $x) (i32.const 8))) (i32.const 1)) (i32.const 8)) (i32.sub (i32.const 255) (local.get $alpha)))
        (select (i32.const 306) (select (i32.const 601) (i32.const 117) (i32.eq (local.get $channel) (i32.const 1))) (i32.eqz (local.get $channel))))))
      (local.set $channel (i32.add (local.get $channel) (i32.const 1)))
      (br_if $channels (i32.lt_u (local.get $channel) (i32.const 3))))
    (local.get $sum))

  ;; Whether the pixel at (x, y) has three or more neighbours of exactly its
  ;; colour. Pixels on the image border count the missing neighbour as one.
  (func $siblings (param $img i32) (param $x i32) (param $y i32) (param $width i32) (param $height i32) (result i32)
    (local $x0 i32) (local $y0 i32) (local $x1 i32) (local $y1 i32) (local $nx i32) (local $ny i32) (local $zeroes i32) (local $colour i32)
    (local.set $x0 (select (i32.const 0) (i32.sub (local.get $x) (i32.const 1)) (i32.eqz (local.get $x))))
    (local.set $y0 (select (i32.const 0) (i32.sub (local.get $y) (i32.const 1)) (i32.eqz (local.get $y))))
    (local.set $x1 (select (local.get $x) (i32.add (local.get $x) (i32.const 1)) (i32.eq (i32.add (local.get $x) (i32.const 1)) (local.get $width))))
    (local.set $y1 (select (local.get $y) (i32.add (local.get $y) (i32.const 1)) (i32.eq (i32.add (local.get $y) (i32.const 1)) (local.get $height))))
    (local.set $zeroes (i32.or (i32.or (i32.eq (local.get $x) (local.get $x0)) (i32.eq (local.get $x) (local.get $x1)))
                               (i32.or (i32.eq (local.get $y) (local.get $y0)) (i32.eq (local.get $y) (local.get $y1)))))
    (local.set $colour (i32.load (i32.add (local.get $img) (i32.shl (i32.add (i32.mul (local.get $y) (local.get $width)) (local.get $x)) (i32.const 2)))))
    (local.set $nx (local.get $x0))
    (block $done
      (loop $columns
        (br_if $done (i32.gt_u (local.get $nx) (local.get $x1)))
        (local.set $ny (local.get $y0))
        (loop $rows
          (if (i32.and (i32.eqz (i32.and (i32.eq (local.get $nx) (local.get $x)) (i32.eq (local.get $ny) (local.get $y))))
                       (i32.eq (local.get $colour) (i32.load (i32.add (local.get $img) (i32.shl (i32.add (i32.mul (local.get $ny) (local.get $width)) (local.get $nx)) (i32.const 2))))))
            (then
              (local.set $zeroes (i32.add (local.get $zeroes) (i32.const 1)))
              (if (i32.gt_u (local.get $zeroes) (i32.const 2)) (then (return (i32.const 1))))))
          (local.set $ny (i32.add (local.get $ny) (i32.const 1)))
          (br_if $rows (i32.le_u (local.get $ny) (local.get $y1))))
        (local.set $nx (i32.add (local.get $nx) (i32.const 1)))
        (br $columns)))
    (i32.const 0))

  ;; Anti-aliased pixel and intensity slope detector (Vysniauskas 2009, as in
  ;; pixelmatch): the pixel at (x, y) in $img has at most two neighbours of
  ;; equal brightness, at least one darker and one brighter, and the darkest
  ;; or the brightest of them is a solid area in both captures.
  (func $antialiased (param $img i32) (param $other i32) (param $x i32) (param $y i32) (param $width i32) (param $height i32) (result i32)
    (local $x0 i32) (local $y0 i32) (local $x1 i32) (local $y1 i32) (local $nx i32) (local $ny i32) (local $zeroes i32)
    (local $centre i32) (local $delta i32) (local $min i32) (local $max i32) (local $minx i32) (local $miny i32) (local $maxx i32) (local $maxy i32)
    (local.set $x0 (select (i32.const 0) (i32.sub (local.get $x) (i32.const 1)) (i32.eqz (local.get $x))))
    (local.set $y0 (select (i32.const 0) (i32.sub (local.get $y) (i32.const 1)) (i32.eqz (local.get $y))))
    (local.set $x1 (select (local.get $x) (i32.add (local.get $x) (i32.const 1)) (i32.eq (i32.add (local.get $x) (i32.const 1)) (local.get $width))))
    (local.set $y1 (select (local.get $y) (i32.add (local.get $y) (i32.const 1)) (i32.eq (i32.add (local.get $y) (i32.const 1)) (local.get $height))))
    (local.set $zeroes (i32.or (i32.or (i32.eq (local.get $x) (local.get $x0)) (i32.eq (local.get $x) (local.get $x1)))
                               (i32.or (i32.eq (local.get $y) (local.get $y0)) (i32.eq (local.get $y) (local.get $y1)))))
    (local.set $centre (call $luma (i32.add (local.get $img) (i32.shl (i32.add (i32.mul (local.get $y) (local.get $width)) (local.get $x)) (i32.const 2)))))
    (local.set $nx (local.get $x0))
    (block $done
      (loop $columns
        (br_if $done (i32.gt_u (local.get $nx) (local.get $x1)))
        (local.set $ny (local.get $y0))
        (loop $rows
          (if (i32.eqz (i32.and (i32.eq (local.get $nx) (local.get $x)) (i32.eq (local.get $ny) (local.get $y))))
            (then
              (local.set $delta (i32.sub (local.get $centre)
                (call $luma (i32.add (local.get $img) (i32.shl (i32.add (i32.mul (local.get $ny) (local.get $width)) (local.get $nx)) (i32.const 2))))))
              (if (i32.eqz (local.get $delta))
                (then
                  (local.set $zeroes (i32.add (local.get $zeroes) (i32.const 1)))
                  (if (i32.gt_u (local.get $zeroes) (i32.const 2)) (then (return (i32.const 0)))))
                (else
                  (if (i32.lt_s (local.get $delta) (local.get $min))
                    (then (local.set $min (local.get $delta)) (local.set $minx (local.get $nx)) (local.set $miny (local.get $ny)))
                    (else
                      (if (i32.gt_s (local.get $delta) (local.get $max))
                        (then (local.set $max (local.get $delta)) (local.set $maxx (local.get $nx)) (local.set $maxy (local.get $ny))))))))))
          (local.set $ny (i32.add (local.get $ny) (i32.const 1)))
          (br_if $rows (i32.le_u (local.get $ny) (local.get $y1))))
        (local.set $nx (i32.add (local.get $nx) (i32.const 1)))
        (br $columns)))
    (if (i32.or (i32.eqz (local.get $min)) (i32.eqz (local.get $max))) (then (return (i32.const 0))))
    (if (call $siblings (local.get $img) (local.get $minx) (local.get $miny) (local.get $width) (local.get $height))
      (then (if (call $siblings (local.get $other) (local.get $minx) (local.get $miny) (local.get $width) (local.get $height)) (then (return (i32.const 1))))))
    (if (call $siblings (local.get $img) (local.get $maxx) (local.get $maxy) (local.get $width) (local.get $height))
      (then (if (call $siblings (local.get $other) (local.get $maxx) (local.get $maxy) (local.get $width) (local.get $height)) (then (return (i32.const 1))))))
    (i32.const 0))

  ;; Pass 2: clear the marks of anti-aliased pixels in partly changed cells.
  (func $unmark_antialiasing (param $a i32) (param $b i32) (param $marks i32) (param $cells i32) (param $width i32) (param $height i32) (param $cols i32) (param $rows i32)
    (local $cx i32) (local $cy i32) (local $count i32) (local $cw i32) (local $ch i32) (local $x i32) (local $y i32) (local $mark i32) (local $partial i32)
    ;; More than an eighth of the pixels marked in partly changed cells is a
    ;; real change, not edge noise: skip the pass rather than spend on it.
    (block $sum_done
      (loop $sum
        (br_if $sum_done (i32.ge_u (local.get $cy) (local.get $rows)))
        (local.set $ch (select (i32.const 8) (i32.sub (local.get $height) (i32.shl (local.get $cy) (i32.const 3))) (i32.ge_u (i32.sub (local.get $height) (i32.shl (local.get $cy) (i32.const 3))) (i32.const 8))))
        (local.set $cx (i32.const 0))
        (loop $sum_row
          (local.set $cw (select (i32.const 8) (i32.sub (local.get $width) (i32.shl (local.get $cx) (i32.const 3))) (i32.ge_u (i32.sub (local.get $width) (i32.shl (local.get $cx) (i32.const 3))) (i32.const 8))))
          (local.set $count (i32.load (i32.add (local.get $cells) (i32.shl (i32.add (i32.mul (local.get $cy) (local.get $cols)) (local.get $cx)) (i32.const 3)))))
          (if (i32.lt_u (local.get $count) (i32.mul (local.get $cw) (local.get $ch)))
            (then (local.set $partial (i32.add (local.get $partial) (local.get $count)))))
          (local.set $cx (i32.add (local.get $cx) (i32.const 1)))
          (br_if $sum_row (i32.lt_u (local.get $cx) (local.get $cols))))
        (local.set $cy (i32.add (local.get $cy) (i32.const 1)))
        (br $sum)))
    (if (i32.gt_u (local.get $partial) (i32.shr_u (i32.mul (local.get $width) (local.get $height)) (i32.const 3))) (then (return)))
    (local.set $cy (i32.const 0))
    (block $cells_done
      (loop $cell_rows
        (br_if $cells_done (i32.ge_u (local.get $cy) (local.get $rows)))
        (local.set $ch (select (i32.const 8) (i32.sub (local.get $height) (i32.shl (local.get $cy) (i32.const 3))) (i32.ge_u (i32.sub (local.get $height) (i32.shl (local.get $cy) (i32.const 3))) (i32.const 8))))
        (local.set $cx (i32.const 0))
        (loop $cell_columns
          (local.set $cw (select (i32.const 8) (i32.sub (local.get $width) (i32.shl (local.get $cx) (i32.const 3))) (i32.ge_u (i32.sub (local.get $width) (i32.shl (local.get $cx) (i32.const 3))) (i32.const 8))))
          (local.set $count (i32.load (i32.add (local.get $cells) (i32.shl (i32.add (i32.mul (local.get $cy) (local.get $cols)) (local.get $cx)) (i32.const 3)))))
          (if (i32.and (i32.ne (local.get $count) (i32.const 0)) (i32.lt_u (local.get $count) (i32.mul (local.get $cw) (local.get $ch))))
            (then
              (local.set $y (i32.shl (local.get $cy) (i32.const 3)))
              (loop $pixel_rows
                (local.set $x (i32.shl (local.get $cx) (i32.const 3)))
                (loop $pixel_columns
                  (local.set $mark (i32.add (local.get $marks) (i32.add (i32.mul (local.get $y) (local.get $width)) (local.get $x))))
                  (if (i32.load8_u (local.get $mark))
                    (then
                      (if (call $antialiased (local.get $a) (local.get $b) (local.get $x) (local.get $y) (local.get $width) (local.get $height))
                        (then (i32.store8 (local.get $mark) (i32.const 0)))
                        (else (if (call $antialiased (local.get $b) (local.get $a) (local.get $x) (local.get $y) (local.get $width) (local.get $height))
                          (then (i32.store8 (local.get $mark) (i32.const 0))))))))
                  (local.set $x (i32.add (local.get $x) (i32.const 1)))
                  (br_if $pixel_columns (i32.lt_u (local.get $x) (i32.add (i32.shl (local.get $cx) (i32.const 3)) (local.get $cw)))))
                (local.set $y (i32.add (local.get $y) (i32.const 1)))
                (br_if $pixel_rows (i32.lt_u (local.get $y) (i32.add (i32.shl (local.get $cy) (i32.const 3)) (local.get $ch)))))))
          (local.set $cx (i32.add (local.get $cx) (i32.const 1)))
          (br_if $cell_columns (i32.lt_u (local.get $cx) (local.get $cols))))
        (local.set $cy (i32.add (local.get $cy) (i32.const 1)))
        (br $cell_rows))))

  ;; Pass 3: recount every touched cell from its marks and record the pixel
  ;; bounds of its changes. Returns the total.
  (func $summarize (param $marks i32) (param $cells i32) (param $width i32) (param $height i32) (param $cols i32) (param $rows i32) (result i32)
    (local $cx i32) (local $cy i32) (local $cell i32) (local $cw i32) (local $ch i32) (local $p i32) (local $r i32)
    (local $row i32) (local $columns i32) (local $count i32) (local $miny i32) (local $maxy i32) (local $total i32)
    (block $done
      (loop $cell_rows
        (br_if $done (i32.ge_u (local.get $cy) (local.get $rows)))
        (local.set $ch (select (i32.const 8) (i32.sub (local.get $height) (i32.shl (local.get $cy) (i32.const 3))) (i32.ge_u (i32.sub (local.get $height) (i32.shl (local.get $cy) (i32.const 3))) (i32.const 8))))
        (local.set $cx (i32.const 0))
        (loop $cell_columns
          (local.set $cell (i32.add (local.get $cells) (i32.shl (i32.add (i32.mul (local.get $cy) (local.get $cols)) (local.get $cx)) (i32.const 3))))
          (if (i32.load (local.get $cell))
            (then
              (local.set $cw (select (i32.const 8) (i32.sub (local.get $width) (i32.shl (local.get $cx) (i32.const 3))) (i32.ge_u (i32.sub (local.get $width) (i32.shl (local.get $cx) (i32.const 3))) (i32.const 8))))
              (local.set $p (i32.add (local.get $marks) (i32.add (i32.mul (i32.shl (local.get $cy) (i32.const 3)) (local.get $width)) (i32.shl (local.get $cx) (i32.const 3)))))
              (local.set $count (i32.const 0))
              (local.set $columns (i32.const 0))
              (local.set $miny (i32.const 8))
              (local.set $r (i32.const 0))
              (loop $pixel_rows
                ;; One bit per marked pixel in this row of the cell.
                (local.set $row (i32.and (i8x16.bitmask (v128.load64_zero (local.get $p))) (i32.sub (i32.shl (i32.const 1) (local.get $cw)) (i32.const 1))))
                (if (local.get $row)
                  (then
                    (local.set $count (i32.add (local.get $count) (i32.popcnt (local.get $row))))
                    (local.set $columns (i32.or (local.get $columns) (local.get $row)))
                    (if (i32.eq (local.get $miny) (i32.const 8)) (then (local.set $miny (local.get $r))))
                    (local.set $maxy (local.get $r))))
                (local.set $p (i32.add (local.get $p) (local.get $width)))
                (local.set $r (i32.add (local.get $r) (i32.const 1)))
                (br_if $pixel_rows (i32.lt_u (local.get $r) (local.get $ch))))
              (i32.store (local.get $cell) (local.get $count))
              (if (local.get $count)
                (then
                  (i32.store8 offset=4 (local.get $cell) (i32.ctz (local.get $columns)))
                  (i32.store8 offset=5 (local.get $cell) (local.get $miny))
                  (i32.store8 offset=6 (local.get $cell) (i32.sub (i32.const 31) (i32.clz (local.get $columns))))
                  (i32.store8 offset=7 (local.get $cell) (local.get $maxy))))
              (local.set $total (i32.add (local.get $total) (local.get $count)))))
          (local.set $cx (i32.add (local.get $cx) (i32.const 1)))
          (br_if $cell_columns (i32.lt_u (local.get $cx) (local.get $cols))))
        (local.set $cy (i32.add (local.get $cy) (i32.const 1)))
        (br $cell_rows)))
    (local.get $total))

  (func (export "diff") (param $a i32) (param $b i32) (param $marks i32) (param $cells i32) (param $width i32) (param $height i32) (param $max_delta i32) (param $antialias i32) (result i32)
    (local $cols i32) (local $rows i32) (local $x i32) (local $y i32) (local $row i32) (local $cell i32) (local $n i32)
    (local $max v128) (local $blocks i32)
    (local.set $cols (i32.shr_u (i32.add (local.get $width) (i32.const 7)) (i32.const 3)))
    (local.set $rows (i32.shr_u (i32.add (local.get $height) (i32.const 7)) (i32.const 3)))
    (memory.fill (local.get $cells) (i32.const 0) (i32.shl (i32.mul (local.get $cols) (local.get $rows)) (i32.const 3)))
    (memory.fill (local.get $marks) (i32.const 0) (i32.add (i32.mul (local.get $width) (local.get $height)) (i32.const 16)))
    (local.set $max (f32x4.splat (f32.convert_i32_u (local.get $max_delta))))
    (local.set $blocks (i32.and (local.get $width) (i32.const -16)))
    ;; Pass 1: marks and provisional counts.
    (block $rows_done
      (loop $pixel_rows
        (br_if $rows_done (i32.ge_u (local.get $y) (local.get $height)))
        (local.set $row (i32.add (local.get $cells) (i32.shl (i32.mul (i32.shr_u (local.get $y) (i32.const 3)) (local.get $cols)) (i32.const 3))))
        (local.set $x (i32.const 0))
        ;; Sixteen pixels (two whole cells) per step while they are identical.
        (block $blocks_done
          (loop $next_block
            (br_if $blocks_done (i32.ge_u (local.get $x) (local.get $blocks)))
            (if (v128.any_true (v128.or
                  (v128.or (v128.xor (v128.load (local.get $a)) (v128.load (local.get $b)))
                           (v128.xor (v128.load offset=16 (local.get $a)) (v128.load offset=16 (local.get $b))))
                  (v128.or (v128.xor (v128.load offset=32 (local.get $a)) (v128.load offset=32 (local.get $b)))
                           (v128.xor (v128.load offset=48 (local.get $a)) (v128.load offset=48 (local.get $b))))))
              (then
                (local.set $cell (i32.add (local.get $row) (local.get $x)))
                (local.set $n (i32.add
                  (call $group (local.get $a) (local.get $b) (local.get $marks) (local.get $max) (i32.const 15))
                  (call $group (i32.add (local.get $a) (i32.const 16)) (i32.add (local.get $b) (i32.const 16)) (i32.add (local.get $marks) (i32.const 4)) (local.get $max) (i32.const 15))))
                (i32.store (local.get $cell) (i32.add (i32.load (local.get $cell)) (local.get $n)))
                (local.set $n (i32.add
                  (call $group (i32.add (local.get $a) (i32.const 32)) (i32.add (local.get $b) (i32.const 32)) (i32.add (local.get $marks) (i32.const 8)) (local.get $max) (i32.const 15))
                  (call $group (i32.add (local.get $a) (i32.const 48)) (i32.add (local.get $b) (i32.const 48)) (i32.add (local.get $marks) (i32.const 12)) (local.get $max) (i32.const 15))))
                (i32.store offset=8 (local.get $cell) (i32.add (i32.load offset=8 (local.get $cell)) (local.get $n)))))
            (local.set $a (i32.add (local.get $a) (i32.const 64)))
            (local.set $b (i32.add (local.get $b) (i32.const 64)))
            (local.set $marks (i32.add (local.get $marks) (i32.const 16)))
            (local.set $x (i32.add (local.get $x) (i32.const 16)))
            (br $next_block)))
        ;; The rest of the row, four pixels per step. The last group may read
        ;; past the row (memory always continues), so $keep masks those bits.
        (block $groups_done
          (loop $next_group
            (br_if $groups_done (i32.ge_u (local.get $x) (local.get $width)))
            (local.set $n (call $group (local.get $a) (local.get $b) (local.get $marks) (local.get $max)
              (select (i32.const 15)
                      (i32.sub (i32.shl (i32.const 1) (i32.sub (local.get $width) (local.get $x))) (i32.const 1))
                      (i32.ge_u (i32.sub (local.get $width) (local.get $x)) (i32.const 4)))))
            (local.set $cell (i32.add (local.get $row) (i32.and (local.get $x) (i32.const -8))))
            (i32.store (local.get $cell) (i32.add (i32.load (local.get $cell)) (local.get $n)))
            (local.set $a (i32.add (local.get $a) (i32.const 16)))
            (local.set $b (i32.add (local.get $b) (i32.const 16)))
            (local.set $marks (i32.add (local.get $marks) (i32.const 4)))
            (local.set $x (i32.add (local.get $x) (i32.const 4)))
            (br $next_group)))
        ;; Step back over the pixels the last group borrowed from the next row.
        (local.set $a (i32.sub (local.get $a) (i32.shl (i32.sub (local.get $x) (local.get $width)) (i32.const 2))))
        (local.set $b (i32.sub (local.get $b) (i32.shl (i32.sub (local.get $x) (local.get $width)) (i32.const 2))))
        (local.set $marks (i32.sub (local.get $marks) (i32.sub (local.get $x) (local.get $width))))
        (local.set $y (i32.add (local.get $y) (i32.const 1)))
        (br $pixel_rows)))
    ;; Back to the start of each buffer.
    (local.set $n (i32.shl (i32.mul (local.get $width) (local.get $height)) (i32.const 2)))
    (local.set $a (i32.sub (local.get $a) (local.get $n)))
    (local.set $b (i32.sub (local.get $b) (local.get $n)))
    (local.set $marks (i32.sub (local.get $marks) (i32.mul (local.get $width) (local.get $height))))
    (if (local.get $antialias)
      (then (call $unmark_antialiasing (local.get $a) (local.get $b) (local.get $marks) (local.get $cells) (local.get $width) (local.get $height) (local.get $cols) (local.get $rows))))
    (call $summarize (local.get $marks) (local.get $cells) (local.get $width) (local.get $height) (local.get $cols) (local.get $rows)))

  (func (export "regions") (param $cells i32) (param $stack i32) (param $out i32) (param $cols i32) (param $rows i32) (param $radius i32) (result i32)
    (local $count i32) (local $i i32) (local $label i32) (local $sp i32) (local $current i32) (local $value i32) (local $record i32)
    (local $cx i32) (local $cy i32) (local $x0 i32) (local $x1 i32) (local $ny i32) (local $y1 i32) (local $ptr i32) (local $end i32)
    (local $minx i32) (local $miny i32) (local $maxx i32) (local $maxy i32) (local $pixels i32) (local $edge i32)
    (local.set $count (i32.mul (local.get $cols) (local.get $rows)))
    (block $scan_done
      (loop $scan
        (br_if $scan_done (i32.ge_u (local.get $i) (local.get $count)))
        ;; A changed cell is positive until a region claims it by setting the
        ;; high bit, so one load tells both. pack still sees it as changed.
        (if (i32.gt_s (i32.load (i32.add (local.get $cells) (i32.shl (local.get $i) (i32.const 3)))) (i32.const 0))
          (then
            ;; Flood fill with an explicit stack. Cells are claimed before they
            ;; are pushed, so the stack never exceeds the cell count.
            (local.set $label (i32.add (local.get $label) (i32.const 1)))
            (local.set $ptr (i32.add (local.get $cells) (i32.shl (local.get $i) (i32.const 3))))
            (i32.store (local.get $ptr) (i32.or (i32.load (local.get $ptr)) (i32.const 0x80000000)))
            (i32.store (local.get $stack) (local.get $i))
            (local.set $sp (i32.const 1))
            (local.set $minx (i32.const 0x7fffffff))
            (local.set $miny (i32.const 0x7fffffff))
            (local.set $maxx (i32.const 0))
            (local.set $maxy (i32.const 0))
            (local.set $pixels (i32.const 0))
            (block $fill_done
              (loop $fill
                (br_if $fill_done (i32.eqz (local.get $sp)))
                (local.set $sp (i32.sub (local.get $sp) (i32.const 1)))
                (local.set $current (i32.load (i32.add (local.get $stack) (i32.shl (local.get $sp) (i32.const 2)))))
                (local.set $cy (i32.div_u (local.get $current) (local.get $cols)))
                (local.set $cx (i32.sub (local.get $current) (i32.mul (local.get $cy) (local.get $cols))))
                (local.set $record (i32.add (local.get $cells) (i32.shl (local.get $current) (i32.const 3))))
                (local.set $pixels (i32.add (local.get $pixels) (i32.and (i32.load (local.get $record)) (i32.const 0x7fffffff))))
                ;; Pixel bounds: the cell's origin plus its recorded offsets.
                (local.set $edge (i32.add (i32.shl (local.get $cx) (i32.const 3)) (i32.load8_u offset=4 (local.get $record))))
                (if (i32.lt_u (local.get $edge) (local.get $minx)) (then (local.set $minx (local.get $edge))))
                (local.set $edge (i32.add (i32.shl (local.get $cx) (i32.const 3)) (i32.load8_u offset=6 (local.get $record))))
                (if (i32.gt_u (local.get $edge) (local.get $maxx)) (then (local.set $maxx (local.get $edge))))
                (local.set $edge (i32.add (i32.shl (local.get $cy) (i32.const 3)) (i32.load8_u offset=5 (local.get $record))))
                (if (i32.lt_u (local.get $edge) (local.get $miny)) (then (local.set $miny (local.get $edge))))
                (local.set $edge (i32.add (i32.shl (local.get $cy) (i32.const 3)) (i32.load8_u offset=7 (local.get $record))))
                (if (i32.gt_u (local.get $edge) (local.get $maxy)) (then (local.set $maxy (local.get $edge))))
                ;; Clamp the neighbour window to the grid once, then walk each
                ;; of its rows with a pointer.
                (local.set $x0 (select (i32.const 0) (i32.sub (local.get $cx) (local.get $radius)) (i32.lt_s (i32.sub (local.get $cx) (local.get $radius)) (i32.const 0))))
                (local.set $x1 (select (i32.sub (local.get $cols) (i32.const 1)) (i32.add (local.get $cx) (local.get $radius)) (i32.ge_u (i32.add (local.get $cx) (local.get $radius)) (local.get $cols))))
                (local.set $ny (select (i32.const 0) (i32.sub (local.get $cy) (local.get $radius)) (i32.lt_s (i32.sub (local.get $cy) (local.get $radius)) (i32.const 0))))
                (local.set $y1 (select (i32.sub (local.get $rows) (i32.const 1)) (i32.add (local.get $cy) (local.get $radius)) (i32.ge_u (i32.add (local.get $cy) (local.get $radius)) (local.get $rows))))
                (block $window_done
                  (loop $window_row
                    (br_if $window_done (i32.gt_u (local.get $ny) (local.get $y1)))
                    (local.set $ptr (i32.add (local.get $cells) (i32.shl (i32.add (i32.mul (local.get $ny) (local.get $cols)) (local.get $x0)) (i32.const 3))))
                    (local.set $end (i32.add (local.get $ptr) (i32.shl (i32.sub (local.get $x1) (local.get $x0)) (i32.const 3))))
                    (block $cells_done
                      (loop $next_cell
                        (local.set $value (i32.load (local.get $ptr)))
                        (if (i32.gt_s (local.get $value) (i32.const 0))
                          (then
                            (i32.store (local.get $ptr) (i32.or (local.get $value) (i32.const 0x80000000)))
                            (i32.store (i32.add (local.get $stack) (i32.shl (local.get $sp) (i32.const 2))) (i32.shr_u (i32.sub (local.get $ptr) (local.get $cells)) (i32.const 3)))
                            (local.set $sp (i32.add (local.get $sp) (i32.const 1)))))
                        (br_if $cells_done (i32.ge_u (local.get $ptr) (local.get $end)))
                        (local.set $ptr (i32.add (local.get $ptr) (i32.const 8)))
                        (br $next_cell)))
                    (local.set $ny (i32.add (local.get $ny) (i32.const 1)))
                    (br $window_row)))
                (br $fill)))
            (local.set $record (i32.add (local.get $out) (i32.mul (i32.sub (local.get $label) (i32.const 1)) (i32.const 20))))
            (i32.store offset=0 (local.get $record) (local.get $minx))
            (i32.store offset=4 (local.get $record) (local.get $miny))
            (i32.store offset=8 (local.get $record) (local.get $maxx))
            (i32.store offset=12 (local.get $record) (local.get $maxy))
            (i32.store offset=16 (local.get $record) (local.get $pixels))))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $scan)))
    (local.get $label))

  (func (export "pack") (param $cells i32) (param $out i32) (param $count i32)
    (local $i i32) (local $byte i32)
    (memory.fill (local.get $out) (i32.const 0) (i32.shr_u (i32.add (local.get $count) (i32.const 7)) (i32.const 3)))
    (block $done
      (loop $next
        (br_if $done (i32.ge_u (local.get $i) (local.get $count)))
        (if (i32.ne (i32.load (i32.add (local.get $cells) (i32.shl (local.get $i) (i32.const 3)))) (i32.const 0))
          (then
            (local.set $byte (i32.add (local.get $out) (i32.shr_u (local.get $i) (i32.const 3))))
            (i32.store8 (local.get $byte)
              (i32.or (i32.load8_u (local.get $byte)) (i32.shl (i32.const 1) (i32.and (local.get $i) (i32.const 7)))))))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $next)))))
