package com.luna.gringotts.data.repository

import com.luna.gringotts.data.remote.BudgetApi
import com.luna.gringotts.data.remote.model.BudgetDto
import com.luna.gringotts.data.remote.model.BudgetUtilizationDto
import com.squareup.moshi.Moshi
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BudgetRepository @Inject constructor(
    private val api: BudgetApi,
    private val moshi: Moshi
) {
    suspend fun getActiveBudget(): Result<BudgetDto?> {
        return try {
            val response = api.getActiveBudget()
            if (response.isSuccessful) {
                val data = response.body()?.get("data")
                if (data != null && data is Map<*, *> && data.isEmpty()) {
                    Result.success(null)
                } else {
                    val json = moshi.adapter(Any::class.java).toJson(data)
                    val budget = moshi.adapter(BudgetDto::class.java).fromJson(json)
                    Result.success(budget)
                }
            } else {
                Result.failure(Exception("Failed to fetch active budget"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getActiveBudgetUtilization(): Result<BudgetUtilizationDto?> {
        return try {
            val response = api.getActiveBudgetUtilization()
            if (response.isSuccessful) {
                val data = response.body()?.get("data")
                if (data != null && data is Map<*, *> && data.isEmpty()) {
                    Result.success(null)
                } else {
                    val json = moshi.adapter(Any::class.java).toJson(data)
                    val util = moshi.adapter(BudgetUtilizationDto::class.java).fromJson(json)
                    Result.success(util)
                }
            } else {
                Result.failure(Exception("Failed to fetch utilization"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
