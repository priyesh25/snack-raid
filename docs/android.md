# Snack Raid on Android

There are two ways to play on a phone.

1. **The app (APK).** Get it at https://priyesh25.github.io/snack-raid/apk/. Best on every phone: full screen, offline, Back button, update notices.
2. **The website.** Open https://priyesh25.github.io/snack-raid/ in Chrome, then "Add to Home screen". No install needed.

## Install the app

1. On the phone, open https://priyesh25.github.io/snack-raid/apk/ and tap **Download the app**.
2. Chrome downloads it. Tap **Open**.
3. The first time, Android says installs from Chrome are blocked. Tap **Settings**, turn on **Allow from this source**, and go back.
4. Tap **Install**. Google Play Protect may warn that it does not know the app. Tap **Install anyway**. This happens with every app that is not on the Play Store.

Android 7 (2016) and newer. Phones and tablets.

## How updates work

- New versions are GitHub releases of this repo, tagged `vX.Y.Z`, each with a `snack-raid.apk`.
- The app knows its own version (`VERSION` in `app/js/data.js`).
- **On every launch** the app asks the GitHub releases API for the newest tag. If it is newer, the title screen, the bedroom and Settings show a pink "Version X is ready. Tap to update" button.
- **Settings > Check for updates** does the same check on demand.
- **In the background**, about every 12 hours when online, `UpdateWorker` does the same check and posts one notification per new version. Tapping it downloads the APK.
- The update button and the notification download `releases/latest/download/snack-raid.apk`, so the link never goes stale.
- The same APK also sits at the repo root as `snack-raid-X.Y.Z.apk` (only the newest), with a download page in `apk/`. New players use https://priyesh25.github.io/snack-raid/apk/.
- Installing the new APK over the old one keeps all progress. This only works because every release is signed with the same key (see below).
- Android 13 and newer ask once, on first launch, whether Snack Raid may send notifications. If the player says no, the in-game button still works.
- The check sends nothing about the player. It reads a public web page.

## How progress is kept

- Progress lives in the app's own storage on the phone (the WebView's localStorage). It survives app updates.
- Up to 4 raiders per phone, each with a name and their own progress.
- Uninstalling the app or "Clear storage" deletes progress. To move to a new phone, use **Raiders > Copy my save code** and paste the code on the other phone.
- The website and the app keep separate saves. A save code moves a raider between them too.
- Android's own backup may also restore the save on a new phone (`allowBackup` is on). That is up to the phone's settings, so do not count on it.

## Shipping a new version

1. Change the game in `app/`.
2. Bump `VERSION` in `app/js/data.js` and `CACHE` in `app/sw.js`.
3. Add `docs/release-notes/vX.Y.Z.md`: a few short lines a kid can read.
4. Push to `main`.

The **Android** workflow (`.github/workflows/android.yml`) then runs the tests, builds the APK, signs it, checks the signature and creates the release. Then it copies the APK to the repo root as `snack-raid-X.Y.Z.apk`, deletes the old one, writes `apk/index.html` with `tools/apk-page.sh`, and pushes that commit to `main`. Pull before your next push. Installed apps see it on their next launch or background check. If the version already has a release, the workflow only builds (the APK is kept as a workflow artifact).

## The signing key

Android only installs an update if it is signed with the same key as the app already on the phone.

- The key was made on Priyesh's PC in `C:\Users\PriyeshKumar\snack-raid-signing\`. `README.txt` there has the alias and password.
- **Back that folder up.** If it is lost, phones must uninstall (and lose progress) before they can install a newer build.
- It is never in the repo. `.gitignore` blocks `*.p12`, `*.jks` and `*.keystore`.
- GitHub Actions gets it from three repo secrets. To set or replace them, from the repo folder, in Git Bash:

```sh
K=~/snack-raid-signing
base64 -w0 "$K/snack-raid-release.p12" | gh secret set SNACK_KEYSTORE_B64
gh secret set SNACK_KEYSTORE_PASSWORD < "$K/password.txt"
printf snackraid | gh secret set SNACK_KEY_ALIAS
```

Without the secrets the workflow still builds, but the APK is unsigned and no release is made.

## What the wrapper does

The project is [Capacitor](https://capacitorjs.com) 8. `capacitor.config.json` points it at `app/`, and `npx cap sync android` copies the game into `android/app/src/main/assets/public` (not committed).

| Piece | Where | Why |
| --- | --- | --- |
| Landscape lock | `AndroidManifest.xml`, `sensorLandscape` | Either way up, never portrait |
| Game category | `AndroidManifest.xml`, `appCategory="game"` | Android 16 lets games keep their orientation on tablets |
| Full screen | `MainActivity.java` | Hides the status and navigation bars. A swipe from the edge shows them for a moment |
| Notch | Capacitor's SystemBars, plus no `viewport-fit=cover` in `index.html` | The game stays clear of camera cutouts. The strip is navy |
| Screen stays on | `MainActivity.java` | So it does not dim mid-sneak |
| Back button | `MainActivity.java` calls `window.snackRaidBack()` in `main.js` | Pauses a night, goes back one menu, or leaves from the title |
| Update notices | `UpdateWorker.java` (WorkManager) | Background check, one notification per version |
| Icons and splash | `tools/android-icons.py` | Made from `app/assets/img/icon-512.png` |
| Version | `android/app/build.gradle` reads `app/js/data.js` | 0.2.0 becomes versionCode 200 |
| Offline | The game files are inside the APK | No service worker in the app |

In the game code, `app/js/native.js` holds the app-only parts. `isApp()` is true when `window.Capacitor` says so.

## Build it on a PC (optional)

GitHub builds every release, so this is only for trying things on a phone over USB. You need Node 22, JDK 21 and Android Studio.

```sh
npm ci
npx cap sync android
npx cap open android      # Android Studio. Press Run.
```

After every change to `app/`, run `npx cap sync android` again.

## Google Play

Possible, but not easy for a personal kids' game, so it is not done:

- A $25 developer account and ID checks. New personal accounts must run a closed test with at least 12 testers for 14 days first.
- A game for under-13s falls under the Families policy: a privacy policy page, content rating, a data safety form, and a Play review.
- Play wants an AAB and a new target Android version every year.

The APK route needs none of that. Play can be added later. The same signing key can be uploaded to Play App Signing.

## Still to check on a real phone

- The stick and buttons under two thumbs.
- Sound starts after the first tap. It pauses when the app goes to the background.
- 60 frames a second. If not, cap `dpr` lower in `app/js/main.js`.
- The notification arrives on brands that kill background work hard (Xiaomi, Oppo, Vivo, some Samsung). Opening the app always shows the update button anyway.
