package com.luna.gringotts.data.remote.model

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PaginatedResponse<T>(
    val data: List<T>,
    val total_count: Int,
    val page: Int,
    val has_more: Boolean
)

@JsonClass(generateAdapter = true)
data class CategoryDto(
    val id: Long,
    val name: String,
    val description: String?,
    val type: String? = "EXPENSE"
)

@JsonClass(generateAdapter = true)
data class SubCategoryDto(
    val id: Long,
    val name: String,
    val category: CategoryDto?
)

@JsonClass(generateAdapter = true)
data class ItemDto(
    val id: Long,
    val name: String,
    val subCategory: SubCategoryDto?
)

@JsonClass(generateAdapter = true)
data class TransactionDto(
    val id: Long,
    val type: String? = "EXPENSE", // Default to EXPENSE if missing to prevent crash
    val value: Double,
    val description: String,
    val referenceNo: String?,
    val transactionTime: String, // ISO 8601 string
    val imported: Boolean,
    val notes: String?,
    
    // Type specific fields mapped directly via Moshi
    val paymentMode: String?, // For EXPENSE
    val source: String?,      // For INCOME
    val active: Boolean?,     // For SAVING
    val withdrawnAmount: Double?, // For SAVING
    
    val category: CategoryDto?,
    val subCategory: SubCategoryDto?,
    val item: ItemDto?
)

data class DashboardSummary(
    val totalExpenses: Double,
    val totalIncomes: Double,
    val totalSavings: Double,
    val recentTransactions: List<TransactionDto>
)

@JsonClass(generateAdapter = true)
data class CategoryRef(val id: Long)

@JsonClass(generateAdapter = true)
data class SubCategoryRef(val id: Long)

@JsonClass(generateAdapter = true)
data class TransactionRequest(
    val value: Double,
    val description: String,
    @com.squareup.moshi.Json(name = "transaction_time") val transactionTime: String,
    val category: CategoryRef?,
    @com.squareup.moshi.Json(name = "subcategory") val subCategory: SubCategoryRef?,
    val notes: String?,
    val paymentMode: String? = null,
    val source: String? = null,
    @com.squareup.moshi.Json(name = "is_in") val isIn: Boolean? = null
)
