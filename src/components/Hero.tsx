'use client'
import { useEffect, useRef, useState } from 'react'
import { HERO_VIDEO, HERO_TIMELINE as T } from '@/data/heroTimeline'

type Phase = 'gaze' | 'centering' | 'photo' | 'hold' | 'lowering'
type Hint = 'look' | 'photo' | 'none'
type InputMode = 'mouse' | 'touch'

const DEAD_ZONE = 0.1          // |x| under this looks straight at the visitor
const PHOTO_ZONE = 0.22        // |x| under this makes a click/tap take a photo
const REACH = 0.75             // fraction of the distance to the edge that gives a full head turn
const GAZE_SMOOTHING = 0.11    // seconds, time constant of the gaze easing
const SEEK_EPSILON = 1 / 48    // skip seeks smaller than half a frame
const HOLD_MS = 1100           // camera stays up after the shot
const LOWER_MS = 1300          // camera comes back down to the friendly state
const COOLDOWN_MS = 500
const REPEAT_DELAY_MS = 1500   // cursor resting in the centre: pause before the sequence plays again
const STALL_MS = 450           // native playback not advancing for this long → step by seeking
const TAP_SLOP = 10            // px
const TAP_MS = 500
const HINT_KEY = 'hero-hint-done'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

// gaze: -1 = full left, 0 = at the visitor, 1 = full right
function gazeToTime(g: number) {
  if (g < 0) return lerp(T.LEFT_START_TIME, T.LEFT_TIME, -g)
  // The right turn is scrubbed along its return half so gaze 0 lands on CENTER_FINAL_TIME,
  // the same frame the photo sequence starts and ends on.
  return lerp(T.CENTER_FINAL_TIME, T.RIGHT_TIME, g)
}

function readHintDone() {
  try { return sessionStorage.getItem(HINT_KEY) === '1' } catch { return false }
}
function writeHintDone() {
  try { sessionStorage.setItem(HINT_KEY, '1') } catch {}
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  const [reducedMotion, setReducedMotion] = useState(false)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('mouse')
  const [hint, setHint] = useState<Hint>('look')

  const interactive = !reducedMotion && !failed

  // Media preferences: reduced motion + whether the primary pointer can hover.
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => {
      setReducedMotion(motion.matches)
      setInputMode(fine.matches ? 'mouse' : 'touch')
    }
    sync()
    if (readHintDone()) setHint('none')
    motion.addEventListener('change', sync)
    fine.addEventListener('change', sync)
    return () => {
      motion.removeEventListener('change', sync)
      fine.removeEventListener('change', sync)
    }
  }, [])

  // The whole interaction lives in refs/closures here so pointer movement never re-renders React.
  useEffect(() => {
    const hero = heroRef.current
    const video = videoRef.current
    if (!interactive || !hero || !video) return

    let phase: Phase = 'gaze'
    let gaze = 0
    let targetGaze = 0
    let raf = 0
    let last = 0
    let phaseStart = 0
    let cooldownUntil = 0
    let manualPhotoTime = -1   // >= 0 when native playback is unavailable and we step the photo by seeking
    let lastPhotoTime = 0
    let lastProgressAt = 0
    let flashed = false
    let hintStage: Hint = readHintDone() ? 'none' : 'look'
    let zone = ''
    let geomStale = true
    let cx = 0, reachL = 1, reachR = 1
    let down: { id: number; x: number; y: number; t: number } | null = null
    let hovering = false        // mouse is resting in the centre zone
    let repeatTimer = 0

    const measure = () => {
      const h = hero.getBoundingClientRect()
      const v = video.getBoundingClientRect()
      cx = v.left + v.width / 2
      reachL = Math.max(1, (cx - h.left) * REACH)
      reachR = Math.max(1, (h.right - cx) * REACH)
      geomStale = false
    }
    const normX = (clientX: number) => {
      if (geomStale) measure()
      const dx = clientX - cx
      return clamp(dx / (dx < 0 ? reachL : reachR), -1, 1)
    }
    const toGaze = (n: number) => {
      const m = Math.abs(n)
      return m < DEAD_ZONE ? 0 : Math.sign(n) * (m - DEAD_ZONE) / (1 - DEAD_ZONE)
    }

    const seekTo = (t: number) => {
      if (video.seeking || video.readyState < 1) return false
      if (Math.abs(video.currentTime - t) > SEEK_EPSILON) { video.currentTime = t; return false }
      return true
    }

    const kick = () => {
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
    }

    const setHintStage = (next: Hint) => {
      if (hintStage === next || hintStage === 'none') return
      hintStage = next
      setHint(next)
      if (next === 'none') writeHintDone()
    }

    const flash = () => {
      flashed = true
      flashRef.current?.animate(
        [{ opacity: 0 }, { opacity: 0.18, offset: 0.12 }, { opacity: 0 }],
        { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)' },
      )
    }

    const startPhoto = (now: number) => {
      phase = 'photo'
      phaseStart = now
      flashed = false
      manualPhotoTime = -1
      lastPhotoTime = T.PHOTO_START_TIME
      lastProgressAt = now
      video.currentTime = T.PHOTO_START_TIME
      video.play().catch(() => {}) // a refusal shows up as a stall below
    }

    const tick = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let keepGoing = true

      if (phase === 'gaze' || phase === 'centering') {
        const target = phase === 'centering' ? 0 : targetGaze
        gaze += (target - gaze) * (1 - Math.exp(-dt / GAZE_SMOOTHING))
        if (Math.abs(target - gaze) < 0.003) gaze = target
        const settled = seekTo(gazeToTime(gaze))
        if (phase === 'centering') {
          if (Math.abs(gaze) < 0.02) startPhoto(now)
        } else if (gaze === target && settled) {
          keepGoing = false
        }
      } else if (phase === 'photo') {
        if (manualPhotoTime >= 0) {
          manualPhotoTime = Math.min(T.PHOTO_END_TIME, manualPhotoTime + dt)
          seekTo(manualPhotoTime)
        } else if (video.currentTime > lastPhotoTime + 0.001) {
          lastPhotoTime = video.currentTime
          lastProgressAt = now
        } else if (now - lastProgressAt > STALL_MS) {
          // play() refused (iOS Low Power Mode) or playback stalled: step through it ourselves.
          video.pause()
          manualPhotoTime = Math.max(T.PHOTO_START_TIME, video.currentTime)
        }
        const t = video.currentTime
        if (!flashed && t >= T.SHUTTER_TIME - 0.02) flash()
        if (t >= T.PHOTO_END_TIME || now - phaseStart > (T.PHOTO_END_TIME - T.PHOTO_START_TIME) * 1000 + 6000) {
          video.pause()
          if (!flashed) flash()
          phase = 'hold'
          phaseStart = now
          setHintStage('none')
        }
      } else if (phase === 'hold') {
        if (now - phaseStart >= HOLD_MS) { phase = 'lowering'; phaseStart = now }
      } else if (phase === 'lowering') {
        const p = Math.min(1, (now - phaseStart) / LOWER_MS)
        const settled = seekTo(lerp(T.PHOTO_END_TIME, T.CENTER_FINAL_TIME, easeInOut(p)))
        if (p >= 1 && settled) {
          phase = 'gaze'
          gaze = 0
          cooldownUntil = now + (hovering ? REPEAT_DELAY_MS : COOLDOWN_MS)
          if (hovering) repeatTimer = window.setTimeout(() => { if (hovering) hoverPhoto() }, REPEAT_DELAY_MS)
        }
      }

      if (keepGoing) raf = requestAnimationFrame(tick)
    }

    const triggerPhoto = () => {
      if (phase !== 'gaze' || performance.now() < cooldownUntil) return // debounce repeat clicks
      phase = 'centering'
      kick()
    }

    // Hovering the centre runs the whole sequence straight away: wave "hi", raise the camera, shoot.
    // While the cursor stays there it repeats after a short pause.
    const hoverPhoto = () => {
      if (phase !== 'gaze' || performance.now() < cooldownUntil) return
      gaze = 0
      startPhoto(performance.now())
      kick()
    }

    // Looking away from the centre cuts the sequence short and turns the head right away.
    const abortSequence = () => {
      if (phase === 'gaze') return
      clearTimeout(repeatTimer)
      video.pause()
      manualPhotoTime = -1
      phase = 'gaze'
      gaze = targetGaze
      kick()
    }

    const look = (n: number) => {
      targetGaze = toGaze(n)
      if (Math.abs(n) >= PHOTO_ZONE) abortSequence()
      if (phase === 'gaze') kick()
      if (hintStage === 'look' && Math.abs(n) > DEAD_ZONE) setHintStage('photo')
    }

    const inPhotoZone = (x: number, y: number) => {
      const v = video.getBoundingClientRect()
      return y >= v.top && y <= v.bottom && Math.abs(normX(x)) < PHOTO_ZONE
    }

    const noteInput = (e: PointerEvent) => setInputMode(e.pointerType === 'mouse' ? 'mouse' : 'touch')

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && !down) return
      const n = normX(e.clientX)
      look(n)
      if (e.pointerType === 'mouse') {
        const inZone = inPhotoZone(e.clientX, e.clientY)
        hovering = inZone
        if (!inZone) clearTimeout(repeatTimer)
        else hoverPhoto()
        const z = phase === 'gaze' && inZone ? 'photo' : ''
        if (z !== zone) { zone = z; if (z) hero.dataset.zone = z; else delete hero.dataset.zone }
      }
    }
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      noteInput(e)
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }
      if (e.pointerType !== 'mouse') look(normX(e.clientX))
    }
    const onPointerUp = (e: PointerEvent) => {
      const d = down
      down = null
      if (!d || d.id !== e.pointerId) return
      if ((e.target as Element).closest('a, button')) return
      const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y)
      if (moved < TAP_SLOP && performance.now() - d.t < TAP_MS && inPhotoZone(e.clientX, e.clientY)) {
        triggerPhoto()
      }
    }
    const onPointerCancel = () => { down = null } // browser took over for vertical scrolling
    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') { hovering = false; clearTimeout(repeatTimer); look(0); zone = ''; delete hero.dataset.zone }
    }

    const stage = hero.querySelector<HTMLElement>('.hero-stage')
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        targetGaze = clamp(targetGaze + (e.key === 'ArrowLeft' ? -0.5 : 0.5), -1, 1)
        abortSequence()
        if (phase === 'gaze') kick()
        setHintStage('photo')
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        targetGaze = 0
        triggerPhoto()
      }
    }

    // Show the centre frame as soon as metadata is in, then let the rest buffer for scrubbing.
    const onMeta = () => {
      video.currentTime = T.CENTER_TIME
      video.preload = 'auto'
    }
    let shown = false
    const onFrame = () => { if (!shown && video.readyState >= 2) { shown = true; setReady(true) } }
    const onError = () => setFailed(true)

    if (video.readyState >= 1) onMeta()
    if (video.readyState >= 2) onFrame()
    if (video.error) onError()
    video.addEventListener('loadedmetadata', onMeta)
    // Any of these means a frame is on screen (the SSR'd element may have loaded before hydration).
    video.addEventListener('loadeddata', onFrame)
    video.addEventListener('seeked', onFrame)
    video.addEventListener('canplay', onFrame)
    video.addEventListener('error', onError)

    const ro = new ResizeObserver(() => { geomStale = true })
    ro.observe(hero)

    hero.addEventListener('pointermove', onPointerMove)
    hero.addEventListener('pointerdown', onPointerDown)
    hero.addEventListener('pointerup', onPointerUp)
    hero.addEventListener('pointercancel', onPointerCancel)
    hero.addEventListener('pointerleave', onPointerLeave)
    stage?.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(repeatTimer)
      ro.disconnect()
      video.pause()
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('loadeddata', onFrame)
      video.removeEventListener('seeked', onFrame)
      video.removeEventListener('canplay', onFrame)
      video.removeEventListener('error', onError)
      hero.removeEventListener('pointermove', onPointerMove)
      hero.removeEventListener('pointerdown', onPointerDown)
      hero.removeEventListener('pointerup', onPointerUp)
      hero.removeEventListener('pointercancel', onPointerCancel)
      hero.removeEventListener('pointerleave', onPointerLeave)
      stage?.removeEventListener('keydown', onKeyDown)
      delete hero.dataset.zone
    }
  }, [interactive])

  const hintCopy = inputMode === 'mouse'
    ? { look: ['Move your cursor', '← Look around →'], photo: ['Hover the centre to say hi', 'Then smile for the camera'] }
    : { look: ['Drag to look around', '← Left · Right →'], photo: ['Tap to take a photo', 'Tap the centre'] }
  const showHint = interactive && ready && hint !== 'none'

  return (
    <section className="hero" ref={heroRef} data-interactive={interactive || undefined}>
      <div
        className="hero-stage"
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive
          ? 'Animated photographer portrait. Use left and right arrow keys to look around, Enter to take a photo.'
          : undefined}
      >
        <div className="hero-frame">
        {interactive ? (
          <video
            ref={videoRef}
            className={`hero-video${ready ? ' is-ready' : ''}`}
            src={HERO_VIDEO.src}
            poster={HERO_VIDEO.poster}
            preload="metadata"
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
            aria-hidden="true"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="hero-video is-ready" src={HERO_VIDEO.poster} alt="" aria-hidden="true" />
        )}
        </div>
        <div className="hero-flash" ref={flashRef} aria-hidden="true" />
      </div>

      <div className={`hero-hint${showHint ? ' is-visible' : ''}`} aria-hidden="true">
        {hint !== 'none' && (
          <div key={`${hint}-${inputMode}`} className="hero-hint-inner">
            <span className="hero-hint-main">{hintCopy[hint][0]}</span>
            <span className="hero-hint-sub">{hintCopy[hint][1]}</span>
          </div>
        )}
      </div>

      <div className="hero-copy">
        <p className="hero-eyebrow">Photography Portfolio</p>
        <h1 className="hero-name">
          Sharath<br />Chandra<br /><em>Thota</em>
        </h1>
        <p className="hero-tagline">Cambridge · Antarctica · Porto · India · Beyond</p>
      </div>
      <div className="hero-scroll">Scroll</div>
    </section>
  )
}
