package com.luna.gringotts.data.remote

import com.luna.gringotts.data.remote.model.PaginatedResponse
import com.luna.gringotts.data.remote.model.TransactionDto
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

import retrofit2.http.POST
import retrofit2.http.DELETE
import retrofit2.http.Body
import com.luna.gringotts.data.remote.model.TransactionRequest

interface TransactionApi {

    @GET("api/v1/expenses")
    suspend fun getExpenses(
        @Query("page") page: Int = 1,
        @Query("filters") filters: String? = null
    ): Response<PaginatedResponse<TransactionDto>>

    @GET("api/v1/incomes")
    suspend fun getIncomes(
        @Query("page") page: Int = 1,
        @Query("filters") filters: String? = null
    ): Response<PaginatedResponse<TransactionDto>>

    @GET("api/v1/savings")
    suspend fun getSavings(
        @Query("page") page: Int = 1,
        @Query("filters") filters: String? = null
    ): Response<PaginatedResponse<TransactionDto>>
    
    @GET("api/v1/transactions/{id}")
    suspend fun getTransactionById(
        @Path("id") id: Long
    ): Response<TransactionDto>

    @GET("api/v1/summary")
    suspend fun getSummary(
        @Query("days") days: Int = 30
    ): Response<Map<String, Any>>

    // Categories
    @GET("api/v1/categories")
    suspend fun getCategories(
        @Query("type") type: String? = null
    ): Response<Map<String, Any>>

    @GET("api/v1/categories/{categoryId}/subcategories")
    suspend fun getSubCategories(
        @Path("categoryId") categoryId: Long
    ): Response<Map<String, Any>>

    // Create Transactions
    @POST("api/v1/expenses")
    suspend fun addExpense(@Body request: TransactionRequest): Response<Map<String, Any>>

    @POST("api/v1/incomes")
    suspend fun addIncome(@Body request: TransactionRequest): Response<Map<String, Any>>
    
    @POST("api/v1/savings")
    suspend fun addSaving(@Body request: TransactionRequest): Response<Map<String, Any>>

    // Delete
    @DELETE("api/v1/transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: Long): Response<Void>
}
