# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ── Notifee (local push notifications) ───────────────────────────────────────
# Keep all Notifee classes so release builds can schedule/display notifications
-keep class io.invertase.notifee.** { *; }
-keep class app.notifee.** { *; }

# Keep raw resource file names so custom notification sounds survive shrinking.
# R8/ProGuard renames raw resources in release; this prevents single_bell from
# being renamed or removed, which would silence notifications in release builds.
-keepclassmembers class **.R$raw {
    public static <fields>;
}

# ── Firebase Messaging ────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
