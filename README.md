# Our Photobooth (together) 📸

A cute white photobooth for two people in different places. React + TypeScript + Vite.
There is no backend: your cameras connect directly (WebRTC), and you swap two codes
in any chat app to introduce them.

## Run it
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/ (deploy it anywhere static)
```
Both of you need the page on HTTPS (or localhost), so deploy `dist/` to Netlify,
Vercel or GitHub Pages and open the same link.

## How to connect
1. Person A: **Create a room**, send the code to Person B.
2. Person B: **Join a room**, paste the code, send the reply code back.
3. Person A: paste the reply code and press **Connect**.
4. Person A picks layout, effect and caption, then presses **Start**. You both get the strip.

## Notes
- Uses Google's public STUN server only to discover each browser's public address.
  Video and photos never pass through it. On very strict networks (some mobile data or
  office Wi-Fi) a direct connection can fail; a TURN server would fix that.
- Person A (host) is on the left or top of each frame.

## Structure
- `src/App.tsx` – state and the synced capture flow
- `src/hooks/usePeer.ts` – WebRTC connection, messages, photo transfer
- `src/hooks/useCamera.ts` – camera and frame capture
- `src/lib/code.ts` – turns connection info into short pasteable codes
- `src/lib/filters.ts`, `src/lib/strip.ts` – effects and the final strip
- `src/components/` – Stage, ConnectPanel, Chips, Result, Doodles
