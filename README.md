<img src="docs/icon.png" width="96" alt="">

# Inkling

Inkling is a calm, offline Android app for learning interesting things a few minutes a day. Each card asks you to guess first, then shows the answer. Spaced reviews bring cards back just before you'd forget them, and a gentle streak keeps you coming back.

## Install on your phone

1. On your Android phone, open **https://github.com/stewie1308-ui/app/releases/latest/download/Inkling.apk**. The download starts straight away.
2. Open the downloaded file. Android will ask whether your browser may install apps. Allow it once.
3. Tap **Install**.

Every push to `main` builds a new version automatically. To update, install the new APK the same way. Your progress is kept.

## What's inside

- 400 starter cards across Science & space, History & oddities, How things work, and Words & ideas.
- Card packs in `packs/`, downloaded in the app via Settings → Get more cards.
- Plain HTML, CSS and JavaScript in `www/`, wrapped as an Android app with Capacitor.

## Adding cards

- **Starter cards:** live in `content/<topic>-N.json`.
- **Packs:** live in `content/packs/<id>.json`. Bump `version` when you change a pack.

Then run:

```bash
npm install
npm run content   # validates every card, builds www/content/starter.json and packs/
npm test
```

Each card needs a guess-first question (`q`), a different review question (`rq`), a short body (60 words at most), a one-line `why`, and a source.

## Development

```bash
node scripts/screenshots.mjs   # screenshots of every screen, saved to .shots/
node scripts/make-icons.mjs    # regenerate launcher icons and splash screens
npx cap sync android           # copy www/ into the Android project
```

## Signing

Release builds are signed with `android/inkling-release.jks` so updates install over earlier versions. The key is committed because this sandboxed setup can't write GitHub secrets.

To move it to secrets, keeping the same key:

1. Base64-encode the file into a secret named `INKLING_KEYSTORE_B64`.
2. Put the password from `android/keystore.properties` into a secret named `INKLING_STORE_PASS`.
3. Delete both files from the repo.

## Licences

The code is MIT. Card text is written in our own words and shared under CC BY-SA 4.0. Each card links to its source.
