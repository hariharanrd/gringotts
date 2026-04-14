package com.luna.gringotts.data.remote

import com.squareup.moshi.JsonClass
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface AuthApi {
    @POST("api/v1/auth/pre-authenticate")
    suspend fun preAuthenticate(
        @Header("X-Trust-Token") trustToken: String?,
        @Body request: PreAuthRequest
    ): Response<PreAuthResponse>

    @POST("api/v1/auth/authenticate")
    suspend fun authenticate(
        @Body request: AuthRequest
    ): Response<AuthResponse>
}

@JsonClass(generateAdapter = true)
data class PreAuthRequest(
    val username: String? = null,
    val password: String? = null
)

@JsonClass(generateAdapter = true)
data class PreAuthResponse(
    val requiresMfa: Boolean,
    val preAuthToken: String?,
    val jwt: String?
)

@JsonClass(generateAdapter = true)
data class AuthRequest(
    val preAuthToken: String,
    val code: Int,
    val trustBrowser: Boolean
)

@JsonClass(generateAdapter = true)
data class AuthResponse(
    val trustToken: String?,
    val jwt: String
)
