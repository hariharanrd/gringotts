package com.luna.gringotts.data.repository

import android.util.Log
import com.luna.gringotts.data.remote.AuthApi
import com.luna.gringotts.data.remote.AuthRequest
import com.luna.gringotts.data.remote.PreAuthRequest
import com.luna.gringotts.util.TokenStore
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val tokenStore: TokenStore
) {
    private val TAG = "AuthRepository"

    suspend fun silentRefresh(): Boolean {
        val trustToken = tokenStore.getTrustToken() ?: return false
        
        return try {
            val response = authApi.preAuthenticate(
                trustToken = trustToken,
                request = PreAuthRequest() // Empty credentials, relying on trust token
            )
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (!body.requiresMfa && body.jwt != null) {
                    tokenStore.saveJwt(body.jwt)
                    true
                } else {
                    false
                }
            } else {
                Log.e(TAG, "Silent refresh failed with code: ${response.code()}")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Silent refresh exception: ${e.message}", e)
            false
        }
    }

    suspend fun preAuthenticate(username: String, password: String): Result<String> {
        Log.d(TAG, "Attempting pre-auth for user: $username")
        return try {
            val response = authApi.preAuthenticate(
                trustToken = tokenStore.getTrustToken(),
                request = PreAuthRequest(username, password)
            )
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (!body.requiresMfa && body.jwt != null) {
                    // Bypass MFA via existing trust token
                    tokenStore.saveJwt(body.jwt)
                    tokenStore.saveUsername(username)
                    Log.d(TAG, "Pre-auth successful: MFA bypassed via trust token")
                    Result.success("") // Empty string signifies no MFA needed
                } else if (body.requiresMfa && body.preAuthToken != null) {
                    // Need MFA
                    tokenStore.saveUsername(username)
                    Log.d(TAG, "Pre-auth successful: MFA required")
                    Result.success(body.preAuthToken)
                } else {
                    Log.e(TAG, "Pre-auth failed: Unknown authentication state")
                    Result.failure(Exception("Unknown authentication state"))
                }
            } else {
                Log.e(TAG, "Pre-auth failed: code=${response.code()} error=${response.errorBody()?.string()}")
                Result.failure(Exception("Authentication failed"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Pre-auth exception: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun authenticate(preAuthToken: String, code: Int): Result<Unit> {
        Log.d(TAG, "Submitting MFA code for preAuthToken: $preAuthToken")
        return try {
            val response = authApi.authenticate(
                request = AuthRequest(
                    preAuthToken = preAuthToken,
                    code = code,
                    trustBrowser = true // Always send trustBrowser = true as per requirements
                )
            )
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                tokenStore.saveJwt(body.jwt)
                if (body.trustToken != null) {
                    tokenStore.saveTrustToken(body.trustToken)
                }
                Log.d(TAG, "MFA authentication successful, JWT saved")
                Result.success(Unit)
            } else {
                Log.e(TAG, "MFA authentication failed: code=${response.code()} error=${response.errorBody()?.string()}")
                Result.failure(Exception("Invalid 2FA code"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "MFA authentication exception: ${e.message}", e)
            Result.failure(e)
        }
    }

    fun logout() {
        tokenStore.clearAll()
    }
}
