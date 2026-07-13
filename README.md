# The Closet 👗🧥

A wardrobe cataloguer and outfit matcher, inspired by that closet computer from *Clueless*. Photograph your clothes, catalogue them by category, and get outfit suggestions — either built around one piece, or composed fully for an occasion and the weather.

**Live demo:** _add your deployed link here once you publish it (see Deploying, below)_

## Why this exists

If you own a lot of clothes, it's easy to forget half of what's in your closet — and matching pieces well takes real thought. This app keeps a photographed inventory and does the color-theory/style-matching work for you.

## Features

- 📸 **Add items** by photo — colour is detected automatically from the image, no typing required
- 🗑️ **Delete** any item from the closet grid or flip-through view, with a confirmation prompt
- 🗂️ **23 categories**: tops/shirts, short/midi/long dresses, gowns, jumpsuits/rompers, blazers, jackets/coats, hoodies/sweaters, skirts, jeans, shorts, pants, activewear, footwear, hats, purses/bags, belts, glasses, watches, rings, necklaces, earrings, scarves
- ✂️ **Background cutout** — after adding a photo, tap "Cut out background" for a free, local (no upload, no AI) chroma-key style removal. Works best on plain backgrounds; for trickier ones, use your phone's built-in subject-lift tool (iPhone: long-press the photo; Android: open in Google Photos) and re-upload that version instead.
- 🔲 **Grid browser** — see your whole closet, filterable by category
- 🎴 **Flip-through mode** — click through items one at a time, index-card style
- 🎯 **Match Me**, three ways:
  - *Build around an item* — pick one piece, get the best match from every other category
  - *Full outfit* — pick an occasion + weather, get a complete look
  - *Surprise me* — no picking required, get a randomly (but still formality/colour-aware) composed outfit
- 🎨 **12 style profiles** — Old Money, Preppy, Coquette, Y2K, Clean Girl, Dark Academia, Light Academia, Streetwear, Goth, Cottagecore, Grunge, Boho, Fairycore (13 counting Casual Everyday as the default lens). Each is a plain data object in `js/styleProfiles.js` — add your own without touching any other code.
- 🧍 **Mannequin preview** — a stylized (non-photographic) figure with real cm-based measurements (height, bust, waist, hip, thigh, hip/glute depth), male/female/unisex silhouette, skin tone, eye colour, and a broad hairstyle set (buzzcut to long, straight/wavy/curly/coily/afro, plus ponytail/braids/bun). Outfits render using the **actual photographed garment**, clipped into the correct body shape — not a flat color block — so it reads as genuinely wearing that piece. Deliberately not a photo of you — see the note below on why.
- 🤖 **Optional AI Stylist** — turn on in Settings and add your own Anthropic API key to ask freeform questions like *"something for a rainy first date."* Fully optional; the app works completely without it.
- 📱 **Installable PWA** — add it to your phone's home screen for an app-like experience; it's a normal website on desktop
- 🔒 **100% local data** — everything (photos, tags, mannequin settings, your API key if you add one) is stored in your browser's IndexedDB. Nothing is ever uploaded to any server. Export/import a JSON backup any time from Settings.

## Why a mannequin instead of a photo of you?

Actually compositing outfits onto a real photo (like Cher's screen morphing her own image) needs real AI image-generation/editing — a different category of tool than anything free or client-side, and it also means processing an actual photo of your body, which is worth being careful about. Instead, the Mannequin view uses a parametric SVG figure: you set body proportions, skin tone, and hair once, and it re-draws wearing whatever outfit you preview on it. Not photorealistic, but it gives a genuine visual sense of a look without needing (or storing) a photo of you.

## Why no AI photo-recognition for item type?

Early versions of this idea considered training a model to recognize clothing types (and even styling it after a specific TV character's wardrobe). Two problems ruled that out: training a real image-recognition model needs a large labeled dataset and real compute — not practical for a personal project — and building on screenshots/photos of any real show or person raises copyright issues. Instead:
- **Colour** is detected reliably and instantly using plain canvas pixel analysis (`js/colorDetect.js`) — genuinely free, no model needed.
- **Category** (top, jacket, etc.) is chosen manually when you add an item — quick, always accurate, and matches how you're already organizing your closet.
- **Aesthetic/style** is captured through the style-profile system (`js/styleProfiles.js`), written from general style vocabulary (preppy, streetwear, minimalist…), not any individual's likeness.

## Getting started

No build step, no npm install required to run it.

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/the-closet.git
   cd the-closet
   ```
2. Serve it locally (a plain `file://` open won't support the service worker or camera capture reliably — use a local server):
   ```bash
   python3 -m http.server 8000
   # then open http://localhost:8000
   ```
   or, with Node installed:
   ```bash
   npx serve .
   ```
3. Open it on your phone (same network) to test "Add to Home Screen."

## Deploying for others to use

Since it's static files with no backend, any static host works:

- **GitHub Pages**: Settings → Pages → deploy from the `main` branch root. Your app will be live at `https://YOUR_USERNAME.github.io/the-closet/`.
- **Netlify / Vercel**: drag-and-drop the folder or connect the repo — zero configuration needed.

Each visitor gets their own private closet automatically (stored in their own browser) — no accounts, no server costs, no setup on your end.

## Project structure

```
├── index.html              # App shell, all views
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline caching of the app shell
├── css/style.css           # Design system + all styling
├── js/
│   ├── app.js               # Main wiring: navigation, state, event handlers
│   ├── db.js                # IndexedDB wrapper (items + settings)
│   ├── colorDetect.js       # Free local dominant-colour detection
│   ├── styleProfiles.js     # Style profile definitions + colour-harmony helpers
│   ├── matcher.js           # Rule-based outfit matching engine + random outfit generator
│   ├── mannequin.js         # Parametric SVG mannequin + garment overlay rendering
│   ├── ai.js                 # Optional AI Stylist (calls Anthropic API directly)
│   └── ui.js                 # DOM rendering helpers
└── icons/                   # PWA icons
```

## Turning this into a real installable app (Android + iPhone)

The PWA install (Settings → "Add to Home Screen") already behaves like a real app. If you want an actual `.apk` (Android) or `.ipa` (iPhone) file instead, this repo includes a [Capacitor](https://capacitorjs.com) wrapper — same code, no rewrite — plus a ready-to-use cloud build config (`codemagic.yaml`) so you don't need Android Studio or a Mac installed locally.

### Android — free, no local install needed
1. Push this repo to your own GitHub.
2. Create a free account at [codemagic.io](https://codemagic.io) and connect your GitHub repo.
3. Codemagic will detect `codemagic.yaml` automatically — select the **android-apk** workflow and click **Start build**.
4. Codemagic's free tier includes monthly build minutes, enough for occasional builds.
5. When the build finishes, download the `.apk` artifact from the build page (or scan the QR code Codemagic shows).
6. On your Android phone: open the file, allow "install from unknown sources" if prompted, and install. Done — same app icon, but a real installed app rather than a home-screen shortcut.

### iPhone — the one unavoidable catch
Being upfront about this rather than promising something that isn't true: **Apple requires a paid Apple Developer Program membership (US $99/year)** to produce an `.ipa` that installs without a Mac. This is true no matter what tool you use — Codemagic, Xcode, or anything else — it's Apple's platform rule, not a limitation of this project. The **ios-ipa** workflow in `codemagic.yaml` is ready to go the moment you have a Developer account and set up code signing in Codemagic's dashboard (Team settings → Code signing). Until then, the PWA install on iPhone (via Safari → Share → Add to Home Screen) is the free equivalent and works today.

### If you'd rather build locally instead
```bash
npm install
npx cap add android   # or: npx cap add ios (needs a Mac + Xcode)
npx cap sync
npx cap open android  # opens Android Studio
```
From Android Studio you can run on a connected phone or build an APK directly (Build → Build Bundle(s)/APK(s) → Build APK(s)).

## Adding your own style profile



Open `js/styleProfiles.js` and push a new object into `STYLE_PROFILES`:

```js
{
  id: 'cottagecore',
  label: 'Cottagecore',
  description: 'Soft florals, natural fabrics, muted earth tones.',
  paletteHues: [
    { name: 'Sage', hue: 100, tolerance: 25 },
    { name: 'Cream', hue: 40, tolerance: 25 }
  ],
  neutralsBonus: true,
  formalityBias: 'casual',
  tagBonus: ['floral', 'linen', 'cottage'],
  pairingNotes: 'Lean into natural fabrics and soft, muted tones.'
}
```
It'll immediately show up in every style-lens dropdown — no other code changes needed.

## Roadmap ideas

- Multi-photo items (front/back)
- Outfit history / "worn this on" logging
- Shareable/public style profiles as a community-contributed folder
- A real backend + accounts, for anyone who wants cross-device sync (the app is structured so this can be added later without a rewrite)

## License

MIT — see `LICENSE`. Do whatever you like with it.
