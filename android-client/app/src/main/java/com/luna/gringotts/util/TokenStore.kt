package com.luna.gringotts.util

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenStore @Inject constructor(@ApplicationContext context: Context) {

    private val sharedPreferences = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            "gringotts_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        // Fallback to plain SharedPreferences if encryption fails (prevents crash)
        context.getSharedPreferences("gringotts_prefs", Context.MODE_PRIVATE)
    }

    fun saveJwt(token: String) {
        sharedPreferences.edit().putString("jwt", token).apply()
    }

    fun getJwt(): String? = sharedPreferences.getString("jwt", null)

    fun clearJwt() {
        sharedPreferences.edit().remove("jwt").apply()
    }

    fun saveTrustToken(token: String) {
        sharedPreferences.edit().putString("trust_token", token).apply()
    }

    fun getTrustToken(): String? = sharedPreferences.getString("trust_token", null)

    fun clearTrustToken() {
        sharedPreferences.edit().remove("trust_token").apply()
    }

    fun saveUsername(username: String) {
        sharedPreferences.edit().putString("username", username).apply()
    }

    fun getUsername(): String? = sharedPreferences.getString("username", null)

    fun clearAll() {
        sharedPreferences.edit().clear().apply()
    }
}
