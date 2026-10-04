// Interactive hero video: /public/videos/hero.mp4 (10.0s · 24fps · 1920×1080).
// The source file is hero_video.mp4 at the project root; hero.mp4 is the same footage
// re-encoded with a keyframe every 6 frames so scrubbing currentTime is cheap.
//
// All values are seconds into the video, measured frame by frame. Adjust here if the video changes.
export const HERO_VIDEO = {
  src: '/videos/hero.mp4',
  poster: '/videos/hero-poster.jpg', // frame at CENTER_TIME
}

export const HERO_TIMELINE = {
  CENTER_TIME: 1.0,         // looking straight at the visitor (initial frame)
  LEFT_START_TIME: 1.75,    // last centred frame before the head turns left
  LEFT_TIME: 3.2,           // head fully turned to screen-left
  CENTER_RETURN_TIME: 4.0,  // back at the visitor
  RIGHT_TIME: 5.4,          // head fully turned to screen-right
  CENTER_FINAL_TIME: 6.0,   // back at the visitor, smiling — the friendly resting state
  PHOTO_START_TIME: 6.25,   // just before the "hi" wave (hand up ≈6.35–6.8s) → raises camera (≈7.2s) → eye to viewfinder (≈8.0s)
  SHUTTER_TIME: 8.46,       // the flash frame baked into the video
  PHOTO_END_TIME: 9.55,     // camera still held up, before the clip's final drift
}
