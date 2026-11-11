# Wrapping Snack Raid as an Android app

The game in `app/` is a complete website. There are two ways to get it onto a phone.

## 1. Install the hosted game (no tools needed)

1. Host the repo (see the README).
2. Open the link in Chrome on the phone.
3. Chrome menu > "Install app" or "Add to Home screen".

It opens full screen, in landscape, and works offline after the first visit.

## 2. Build a real app with Capacitor

These steps have not been run yet. You need Node.js and Android Studio.

```sh
# from the repo root
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Snack Raid" com.yourname.snackraid --web-dir app
npx cap add android
npx cap sync
npx cap open android      # opens Android Studio. Press Run.
```

Then, in `android/app/src/main/AndroidManifest.xml`, lock the activity to landscape:

```xml
<activity android:screenOrientation="sensorLandscape" ... >
```

After every change to `app/`, run `npx cap sync` again.

Things to check on a real phone:

- The stick and the buttons feel right under two thumbs.
- Sound starts after the first tap.
- The game holds 60 frames a second. If not, lower the sprite detail by capping `dpr` in `app/js/main.js`.
- The back button. Capacitor closes the app by default. Map it to Pause.
