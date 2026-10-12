;; Pixel comparison for visual baselines. The JS wrapper lays out every buffer
;; in this module's memory and copies results out before the next call.
;;
;; diff:    composite RGBA on white (so invisible RGB never counts), then count
;;          changed pixels per cell of size×size pixels (one u32 per cell).
;; regions: group changed cells that lie within `radius` cells of each other
;;          and write [minCol, minRow, maxCol, maxRow, pixels] per region.
;; pack:    one bit per changed cell, least significant bit first, so the UI
;;          can draw the overlay without a full-size mask image.
(module
  (memory (export "memory") 1 1024)

  (func $zero (param $ptr i32) (param $bytes i32)
    (local $end i32)
    (local.set $end (i32.add (local.get $ptr) (local.get $bytes)))
    (block $done
      (loop $next
        (br_if $done (i32.ge_u (local.get $ptr) (local.get $end)))
        (i32.store8 (local.get $ptr) (i32.const 0))
        (local.set $ptr (i32.add (local.get $ptr) (i32.const 1)))
        (br $next))))

  (func $channel (param $pixel i32) (param $offset i32) (result i32)
    (local $alpha i32)
    (local.set $alpha (i32.load8_u offset=3 (local.get $pixel)))
    (i32.add
      (i32.div_u (i32.add (i32.mul (i32.load8_u (i32.add (local.get $pixel) (local.get $offset))) (local.get $alpha)) (i32.const 127)) (i32.const 255))
      (i32.sub (i32.const 255) (local.get $alpha))))

  (func $distance (param $a i32) (param $b i32) (param $channel i32) (result i32)
    (local $d i32)
    (local.set $d (i32.sub (call $channel (local.get $a) (local.get $channel)) (call $channel (local.get $b) (local.get $channel))))
    (select (i32.sub (i32.const 0) (local.get $d)) (local.get $d) (i32.lt_s (local.get $d) (i32.const 0))))

  (func $differs (param $a i32) (param $b i32) (param $threshold i32) (result i32)
    (i32.or
      (i32.gt_u (call $distance (local.get $a) (local.get $b) (i32.const 0)) (local.get $threshold))
      (i32.or
        (i32.gt_u (call $distance (local.get $a) (local.get $b) (i32.const 1)) (local.get $threshold))
        (i32.gt_u (call $distance (local.get $a) (local.get $b) (i32.const 2)) (local.get $threshold)))))

  (func (export "diff") (param $a i32) (param $b i32) (param $cells i32) (param $width i32) (param $height i32) (param $threshold i32) (param $size i32) (result i32)
    (local $cols i32) (local $x i32) (local $y i32) (local $cell i32) (local $span i32) (local $changed i32)
    (local.set $cols (i32.div_u (i32.add (local.get $width) (i32.sub (local.get $size) (i32.const 1))) (local.get $size)))
    (call $zero (local.get $cells)
      (i32.shl (i32.mul (local.get $cols) (i32.div_u (i32.add (local.get $height) (i32.sub (local.get $size) (i32.const 1))) (local.get $size))) (i32.const 2)))
    (block $rows_done
      (loop $rows
        (br_if $rows_done (i32.ge_u (local.get $y) (local.get $height)))
        (local.set $cell (i32.add (local.get $cells) (i32.shl (i32.mul (i32.div_u (local.get $y) (local.get $size)) (local.get $cols)) (i32.const 2))))
        (local.set $span (local.get $size))
        (local.set $x (i32.const 0))
        (block $pixels_done
          (loop $pixels
            (br_if $pixels_done (i32.ge_u (local.get $x) (local.get $width)))
            ;; Identical RGBA words are the common case: skip compositing.
            (if (i32.ne (i32.load (local.get $a)) (i32.load (local.get $b)))
              (then
                (if (call $differs (local.get $a) (local.get $b) (local.get $threshold))
                  (then
                    (i32.store (local.get $cell) (i32.add (i32.load (local.get $cell)) (i32.const 1)))
                    (local.set $changed (i32.add (local.get $changed) (i32.const 1)))))))
            (local.set $a (i32.add (local.get $a) (i32.const 4)))
            (local.set $b (i32.add (local.get $b) (i32.const 4)))
            (local.set $x (i32.add (local.get $x) (i32.const 1)))
            (local.set $span (i32.sub (local.get $span) (i32.const 1)))
            (if (i32.eqz (local.get $span))
              (then
                (local.set $cell (i32.add (local.get $cell) (i32.const 4)))
                (local.set $span (local.get $size))))
            (br $pixels)))
        (local.set $y (i32.add (local.get $y) (i32.const 1)))
        (br $rows)))
    (local.get $changed))

  (func (export "regions") (param $cells i32) (param $labels i32) (param $stack i32) (param $out i32) (param $cols i32) (param $rows i32) (param $radius i32) (result i32)
    (local $count i32) (local $i i32) (local $label i32) (local $sp i32) (local $current i32)
    (local $cx i32) (local $cy i32) (local $nx i32) (local $ny i32) (local $neighbour i32)
    (local $minx i32) (local $miny i32) (local $maxx i32) (local $maxy i32) (local $pixels i32) (local $record i32)
    (local.set $count (i32.mul (local.get $cols) (local.get $rows)))
    (call $zero (local.get $labels) (i32.shl (local.get $count) (i32.const 2)))
    (block $scan_done
      (loop $scan
        (br_if $scan_done (i32.ge_u (local.get $i) (local.get $count)))
        (if (i32.and
              (i32.ne (i32.load (i32.add (local.get $cells) (i32.shl (local.get $i) (i32.const 2)))) (i32.const 0))
              (i32.eqz (i32.load (i32.add (local.get $labels) (i32.shl (local.get $i) (i32.const 2))))))
          (then
            ;; Flood fill from this cell with an explicit stack. Cells are
            ;; labelled before they are pushed, so the stack never exceeds
            ;; the cell count.
            (local.set $label (i32.add (local.get $label) (i32.const 1)))
            (i32.store (i32.add (local.get $labels) (i32.shl (local.get $i) (i32.const 2))) (local.get $label))
            (i32.store (local.get $stack) (local.get $i))
            (local.set $sp (i32.const 1))
            (local.set $minx (local.get $cols))
            (local.set $miny (local.get $rows))
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
                (local.set $pixels (i32.add (local.get $pixels) (i32.load (i32.add (local.get $cells) (i32.shl (local.get $current) (i32.const 2))))))
                (if (i32.lt_u (local.get $cx) (local.get $minx)) (then (local.set $minx (local.get $cx))))
                (if (i32.gt_u (local.get $cx) (local.get $maxx)) (then (local.set $maxx (local.get $cx))))
                (if (i32.lt_u (local.get $cy) (local.get $miny)) (then (local.set $miny (local.get $cy))))
                (if (i32.gt_u (local.get $cy) (local.get $maxy)) (then (local.set $maxy (local.get $cy))))
                (local.set $ny (i32.sub (local.get $cy) (local.get $radius)))
                (block $ny_done
                  (loop $ny_next
                    (br_if $ny_done (i32.gt_s (local.get $ny) (i32.add (local.get $cy) (local.get $radius))))
                    (if (i32.and (i32.ge_s (local.get $ny) (i32.const 0)) (i32.lt_s (local.get $ny) (local.get $rows)))
                      (then
                        (local.set $nx (i32.sub (local.get $cx) (local.get $radius)))
                        (block $nx_done
                          (loop $nx_next
                            (br_if $nx_done (i32.gt_s (local.get $nx) (i32.add (local.get $cx) (local.get $radius))))
                            (if (i32.and (i32.ge_s (local.get $nx) (i32.const 0)) (i32.lt_s (local.get $nx) (local.get $cols)))
                              (then
                                (local.set $neighbour (i32.shl (i32.add (i32.mul (local.get $ny) (local.get $cols)) (local.get $nx)) (i32.const 2)))
                                (if (i32.and
                                      (i32.ne (i32.load (i32.add (local.get $cells) (local.get $neighbour))) (i32.const 0))
                                      (i32.eqz (i32.load (i32.add (local.get $labels) (local.get $neighbour)))))
                                  (then
                                    (i32.store (i32.add (local.get $labels) (local.get $neighbour)) (local.get $label))
                                    (i32.store (i32.add (local.get $stack) (i32.shl (local.get $sp) (i32.const 2))) (i32.shr_u (local.get $neighbour) (i32.const 2)))
                                    (local.set $sp (i32.add (local.get $sp) (i32.const 1)))))))
                            (local.set $nx (i32.add (local.get $nx) (i32.const 1)))
                            (br $nx_next)))))
                    (local.set $ny (i32.add (local.get $ny) (i32.const 1)))
                    (br $ny_next)))
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
    (call $zero (local.get $out) (i32.shr_u (i32.add (local.get $count) (i32.const 7)) (i32.const 3)))
    (block $done
      (loop $next
        (br_if $done (i32.ge_u (local.get $i) (local.get $count)))
        (if (i32.ne (i32.load (i32.add (local.get $cells) (i32.shl (local.get $i) (i32.const 2)))) (i32.const 0))
          (then
            (local.set $byte (i32.add (local.get $out) (i32.shr_u (local.get $i) (i32.const 3))))
            (i32.store8 (local.get $byte)
              (i32.or (i32.load8_u (local.get $byte)) (i32.shl (i32.const 1) (i32.and (local.get $i) (i32.const 7)))))))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $next)))))
