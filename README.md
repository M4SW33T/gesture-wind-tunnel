# AeroFlow: Virtual Wind Tunnel

A playful gesture-control prototype for exploring airflow behavior around a racing car. It is designed as a portfolio-friendly vibe-coding case study: fast concepting, visible interaction, and a polished enough browser demo without pretending to be a real CFD solver.

## Interaction

- Open palm: widen the airflow field.
- Closed fist: focus the stream into a tighter jet.
- Move hand left or right: rotate the vehicle turntable.
- No hand detected: the model keeps a slow ambient rotation while the HUD searches for a hand again.

## What Was Improved

- Reworked the launch screen and HUD for a cleaner portfolio presentation.
- Fixed garbled text and angle display.
- Added hand-tracking states for loading, camera access, tracking, and searching.
- Smoothed hand position and palm openness so the car does not jitter as much.
- Added a center dead zone for turntable rotation.
- Tuned the airflow particles to reduce random flicker while keeping a dynamic wake.
- Removed unused AI-service scaffolding from the runtime.

## Run Locally

**Prerequisite:** Node.js

```bash
npm install
npm run dev
```

The browser will ask for camera access after you press **Initialize System**.

## Portfolio Note

Suggested framing: "A gesture-driven aerodynamic visualization prototype created with AI-assisted coding, then refined for interaction clarity, input stability, and presentation quality."
