package com.luna.gringotts.data.remote.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class BudgetCategoryAllocationDto(
    val id: Long?,
    val category: CategoryDto,
    @Json(name = "allocated_amount") val allocatedAmount: Double
)

@JsonClass(generateAdapter = true)
data class BudgetDto(
    val id: Long?,
    val name: String,
    val month: Int?,
    val year: Int?,
    @Json(name = "is_master") val isMaster: Boolean,
    @Json(name = "total_amount") val totalAmount: Double,
    @Json(name = "estimated_savings") val estimatedSavings: Double,
    val notes: String?,
    @Json(name = "created_at") val createdAt: String?,
    val allocations: List<BudgetCategoryAllocationDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class BudgetUtilizationDto(
    val budgetId: Long,
    val totalAllocated: Double,
    val totalSpent: Double,
    val remaining: Double,
    val allocations: Map<String, CategoryUtilizationDto>
)

@JsonClass(generateAdapter = true)
data class CategoryUtilizationDto(
    val categoryId: Long,
    val name: String,
    val allocated: Double,
    val spent: Double,
    val remaining: Double,
    val percentage: Double
)
