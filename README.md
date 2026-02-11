# Open Energy

A prototype hub for multiple interactive experiments (quiz, factory, grid map, daylight visualizer, lockbox).

## Main structure

- `public/index.html` – new landing page with prototype links and value-checker stats.
- `public/experience.html` – the multi-tab experience app.

## Interesting TODOs

1. **Shared design system expansion**
   - Continue converging legacy screens onto shared tokenized color/spacing/radius/shadow variables.
2. **Real data mode with fallback strategy**
   - Add explicit data-source mode controls and robust offline fallbacks.
3. **Persistent progress for components** ✅ baseline implemented
   - Quiz progress and selected generation are now persisted.
   - Factory board/level state is restored after refresh.
   - Lockbox state is restored, including unlock status.
4. **Oslo daylight visualizer quality**
   - Improve astronomical correctness and edge-case handling (polar extremes and DST boundaries).
5. **Prototype value checker** ✅ baseline implemented
   - Persist and display usage/progress stats on landing page to identify promising experiments.

## Run locally

```bash
npm install
npm run build
npm run start
```

Visit `http://localhost:3000`.
