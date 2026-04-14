package com.luna.gringotts.util

import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenStore: TokenStore
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip adding Bearer token for auth endpoints to prevent conflicts
        if (originalRequest.url.encodedPath.contains("/auth/pre-authenticate") ||
            originalRequest.url.encodedPath.contains("/auth/authenticate") ||
            originalRequest.url.encodedPath.contains("/auth/register")
        ) {
            return chain.proceed(originalRequest)
        }

        val requestBuilder = originalRequest.newBuilder()
        val jwt = tokenStore.getJwt()

        if (jwt != null) {
            requestBuilder.addHeader("Authorization", "Bearer $jwt")
        }

        return chain.proceed(requestBuilder.build())
    }
}
