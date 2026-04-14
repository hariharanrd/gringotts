package com.luna.gringotts.data.repository

import com.luna.gringotts.data.remote.TransactionApi
import com.luna.gringotts.data.remote.model.CategoryDto
import com.luna.gringotts.data.remote.model.DashboardSummary
import com.luna.gringotts.data.remote.model.PaginatedResponse
import com.luna.gringotts.data.remote.model.SubCategoryDto
import com.luna.gringotts.data.remote.model.TransactionDto
import com.luna.gringotts.data.remote.model.TransactionRequest
import kotlinx.coroutines.coroutineScope
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TransactionRepository @Inject constructor(
    private val api: TransactionApi
) {

    suspend fun getDashboardSummary(): Result<DashboardSummary> = coroutineScope {
        try {
            val response = api.getSummary()
            if (response.isSuccessful && response.body() != null) {
                val map = response.body()!!
                
                // Map server response (snake_case) to our data objects
                val totalExpenses = (map["total_expenses"] as? Number)?.toDouble() ?: 0.0
                val totalIncomes = (map["total_incomes"] as? Number)?.toDouble() ?: 0.0
                val totalSavings = (map["total_savings"] as? Number)?.toDouble() ?: 0.0
                
                @Suppress("UNCHECKED_CAST")
                val recentTransactions = (map["recent_transactions"] as? List<Map<String, Any>>)?.mapNotNull { txMap ->
                    try {
                        TransactionDto(
                            id = (txMap["id"] as? Number)?.toLong() ?: 0L,
                            type = txMap["type"] as? String ?: "EXPENSE",
                            value = (txMap["value"] as? Number)?.toDouble() ?: 0.0,
                            description = txMap["description"] as? String ?: "",
                            referenceNo = txMap["referenceNo"] as? String,
                            transactionTime = txMap["transactionTime"] as? String ?: "",
                            imported = txMap["imported"] as? Boolean ?: false,
                            notes = txMap["notes"] as? String,
                            paymentMode = txMap["paymentMode"] as? String,
                            source = txMap["source"] as? String,
                            active = txMap["active"] as? Boolean,
                            withdrawnAmount = (txMap["withdrawnAmount"] as? Number)?.toDouble(),
                            category = (txMap["category"] as? Map<String, Any>)?.let { catMap ->
                                CategoryDto(
                                    id = (catMap["id"] as? Number)?.toLong() ?: 0L,
                                    name = catMap["name"] as? String ?: "",
                                    description = catMap["description"] as? String
                                )
                            },
                            subCategory = null,
                            item = null
                        )
                    } catch (e: Exception) {
                        null
                    }
                } ?: emptyList()

                Result.success(
                    DashboardSummary(
                        totalExpenses = totalExpenses,
                        totalIncomes = totalIncomes,
                        totalSavings = totalSavings,
                        recentTransactions = recentTransactions
                    )
                )
            } else {
                Result.failure(Exception("Failed to load dashboard: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getExpenses(page: Int): Result<PaginatedResponse<TransactionDto>> {
        return try {
            val response = api.getExpenses(page)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load expenses: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getIncomes(page: Int): Result<PaginatedResponse<TransactionDto>> {
        return try {
            val response = api.getIncomes(page)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load incomes: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSavings(page: Int): Result<PaginatedResponse<TransactionDto>> {
        return try {
            val response = api.getSavings(page)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load savings: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCategories(type: String? = null): Result<List<CategoryDto>> {
        return try {
            val response = api.getCategories(type)
            if (response.isSuccessful && response.body() != null) {
                @Suppress("UNCHECKED_CAST")
                val data = response.body()!!["data"] as? List<Map<String, Any>> ?: emptyList()
                val categories = data.mapNotNull { it.toCategoryDto() }
                Result.success(categories)
            } else {
                Result.failure(Exception("Failed to load categories: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSubCategories(categoryId: Long): Result<List<SubCategoryDto>> {
        return try {
            val response = api.getSubCategories(categoryId)
            if (response.isSuccessful && response.body() != null) {
                @Suppress("UNCHECKED_CAST")
                val data = response.body()!!["data"] as? List<Map<String, Any>> ?: emptyList()
                val subCategories = data.mapNotNull { it.toSubCategoryDto() }
                Result.success(subCategories)
            } else {
                Result.failure(Exception("Failed to load subcategories: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun addTransaction(type: String, request: TransactionRequest): Result<Boolean> {
        return try {
            val response = when (type.uppercase()) {
                "INCOME" -> api.addIncome(request)
                "SAVING" -> api.addSaving(request)
                else -> api.addExpense(request)
            }
            if (response.isSuccessful) {
                Result.success(true)
            } else {
                Result.failure(Exception("Failed to add transaction: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteTransaction(id: Long): Result<Boolean> {
        return try {
            val response = api.deleteTransaction(id)
            if (response.isSuccessful) {
                Result.success(true)
            } else {
                Result.failure(Exception("Failed to delete transaction: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun Map<String, Any>.toCategoryDto(): CategoryDto? {
        return try {
            CategoryDto(
                id = (this["id"] as? Number)?.toLong() ?: return null,
                name = this["name"] as? String ?: "",
                description = this["description"] as? String
            )
        } catch (e: Exception) {
            null
        }
    }

    private fun Map<String, Any>.toSubCategoryDto(): SubCategoryDto? {
        return try {
            SubCategoryDto(
                id = (this["id"] as? Number)?.toLong() ?: return null,
                name = this["name"] as? String ?: "",
                category = (this["category"] as? Map<String, Any>)?.toCategoryDto()
            )
        } catch (e: Exception) {
            null
        }
    }
}
