# ProGuard / R8 Hardening Rules for ZEXO Capacitor Release App

# Preserve Capacitor & WebView Javascript Interfaces
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve Capacitor core, plugins, and web view bridge
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keep class capacitor.cordova.android.plugins.** { *; }

# Preserve Native Camera, Location, Haptics, Preferences, and Status Bar plugin classes
-keep class com.capacitorjs.plugins.camera.** { *; }
-keep class com.capacitorjs.plugins.geolocation.** { *; }
-keep class com.capacitorjs.plugins.haptics.** { *; }
-keep class com.capacitorjs.plugins.preferences.** { *; }
-keep class com.capacitorjs.plugins.statusbar.** { *; }

# Preserve Google Services & Firebase Auth
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.getcapacitor.**

# Suppress non-critical third-party warnings
-dontwarn org.apache.http.**
-dontwarn javax.annotation.**
