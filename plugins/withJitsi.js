const { withProjectBuildGradle, withAndroidManifest, withPlugins, withAppBuildGradle } = require('@expo/config-plugins');

const withJitsiMaven = (config) => {
    return withProjectBuildGradle(config, (config) => {
        if (!config.modResults.contents.includes('github.com/jitsi/jitsi-maven-repository')) {
            config.modResults.contents = config.modResults.contents.replace(
                /repositories \s?{/,
                `repositories {
        maven {
            url "https://github.com/jitsi/jitsi-maven-repository/raw/master/releases"
        }
        maven { 
            url "https://www.jitpack.io" 
        }`
            );
        }

        // Add gradlePluginVersion to ext block if missing
        if (!config.modResults.contents.includes('gradlePluginVersion =')) {
            // Robustly inject into buildscript section
            config.modResults.contents = config.modResults.contents.replace(
                /buildscript\s*\{/,
                `buildscript {
    ext.gradlePluginVersion = "8.1.0"`
            );
        }

        return config;
    });
};

const withJitsiPermissions = (config) => {
    return withAndroidManifest(config, (config) => {
        const androidManifest = config.modResults.manifest;
        const permissions = androidManifest['uses-permission'] || [];

        // Ensure permissions exist
        const requiredPermissions = [
            'android.permission.CAMERA',
            'android.permission.RECORD_AUDIO',
            'android.permission.MODIFY_AUDIO_SETTINGS',
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE'
        ];

        requiredPermissions.forEach(permission => {
            if (!permissions.some(p => p.$['android:name'] === permission)) {
                permissions.push({ $: { 'android:name': permission } });
            }
        });

        androidManifest['uses-permission'] = permissions;
        return config;
    });
};

const withJitsi = (config) => {
    return withPlugins(config, [
        withJitsiMaven,
        withJitsiPermissions
    ]);
};

module.exports = withJitsi;
