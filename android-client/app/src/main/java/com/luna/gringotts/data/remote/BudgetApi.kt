package com.luna.gringotts.data.remote

import com.luna.gringotts.data.remote.model.BudgetDto
import com.luna.gringotts.data.remote.model.BudgetUtilizationDto
import retrofit2.Response
import retrofit2.http.*

interface BudgetApi {
    @GET("api/v1/budgets")
    suspend fun getAllBudgets(): Response<Map<String, Any>>

    @GET("api/v1/budgets/master")
    suspend fun getMasterBudget(): Response<Map<String, Any>>

    @GET("api/v1/budgets/active")
    suspend fun getActiveBudget(): Response<Map<String, Any>>

    @GET("api/v1/budgets/active/utilization")
    suspend fun getActiveBudgetUtilization(): Response<Map<String, Any>>

    @GET("api/v1/budgets/{id}")
    suspend fun getBudgetById(@Path("id") id: Long): Response<Map<String, Any>>

    @POST("api/v1/budgets")
    suspend fun createBudget(@Body budget: BudgetDto): Response<Map<String, Any>>

    @DELETE("api/v1/budgets/{id}")
    suspend fun deleteBudget(@Path("id") id: Long): Response<Map<String, Any>>
}
