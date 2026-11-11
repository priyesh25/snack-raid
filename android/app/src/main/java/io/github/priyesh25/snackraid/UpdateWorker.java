package io.github.priyesh25.snackraid;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

/**
 * About twice a day, when the phone is online, asks GitHub for the newest Snack Raid release.
 * If it is newer than this install, posts one notification. Tapping it downloads the new APK.
 * It sends nothing about the player. It only reads a public web page.
 */
public class UpdateWorker extends Worker {

    static final String LATEST = "https://api.github.com/repos/priyesh25/snack-raid/releases/latest";
    static final String APK = "https://github.com/priyesh25/snack-raid/releases/latest/download/snack-raid.apk";
    static final String CHANNEL = "updates";

    public UpdateWorker(@NonNull Context c, @NonNull WorkerParameters p) { super(c, p); }

    static void schedule(Context c) {
        Constraints net = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(UpdateWorker.class, 12, TimeUnit.HOURS)
            .setConstraints(net).build();
        WorkManager.getInstance(c).enqueueUniquePeriodicWork("update-check", ExistingPeriodicWorkPolicy.KEEP, req);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            Context c = getApplicationContext();
            String latest = fetchLatestTag();
            if (latest == null) return Result.success();
            String mine = c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionName;
            if (!isNewer(latest, mine)) return Result.success();
            SharedPreferences p = c.getSharedPreferences("snackraid", Context.MODE_PRIVATE);
            if (latest.equals(p.getString("notified", ""))) return Result.success();
            if (notifyUpdate(c, latest)) p.edit().putString("notified", latest).apply();
            return Result.success();
        } catch (Exception e) {
            return Result.success(); // offline or GitHub is busy: try again next time
        }
    }

    private static String fetchLatestTag() throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(LATEST).openConnection();
        h.setConnectTimeout(10000);
        h.setReadTimeout(10000);
        h.setRequestProperty("Accept", "application/vnd.github+json");
        h.setRequestProperty("User-Agent", "SnackRaid-Android");
        try {
            if (h.getResponseCode() != 200) return null;
            StringBuilder sb = new StringBuilder();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(h.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = r.readLine()) != null) sb.append(line);
            }
            String tag = new JSONObject(sb.toString()).optString("tag_name", "");
            return tag.isEmpty() ? null : tag.replaceFirst("^v", "");
        } finally {
            h.disconnect();
        }
    }

    /** "0.2.0" is newer than "0.1.9". Parts that are not numbers count as 0. */
    static boolean isNewer(String a, String b) {
        String[] x = a.split("\\."), y = (b == null ? "0" : b).split("\\.");
        for (int i = 0; i < Math.max(x.length, y.length); i++) {
            int p = i < x.length ? num(x[i]) : 0, q = i < y.length ? num(y[i]) : 0;
            if (p != q) return p > q;
        }
        return false;
    }

    private static int num(String s) {
        try { return Integer.parseInt(s.replaceAll("[^0-9]", "")); } catch (Exception e) { return 0; }
    }

    private static boolean notifyUpdate(Context c, String version) {
        NotificationManagerCompat nm = NotificationManagerCompat.from(c);
        if (!nm.areNotificationsEnabled()) return false;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "New versions", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Tells you when a new Snack Raid is ready");
            c.getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse(APK)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_snack)
            .setColor(0xFFFFB627)
            .setContentTitle("Snack Raid " + version + " is ready")
            .setContentText("Tap to get the new version. Your progress stays.")
            .setContentIntent(pi)
            .setAutoCancel(true);
        try {
            nm.notify(1, b.build());
            return true;
        } catch (SecurityException e) {
            return false;
        }
    }
}
