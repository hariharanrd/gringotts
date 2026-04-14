package com.luna.gringotts.data.repository

import com.luna.gringotts.data.remote.CategoryApi
import com.luna.gringotts.data.remote.model.CategoryDto
import com.luna.gringotts.data.remote.model.ItemDto
import com.luna.gringotts.data.remote.model.SubCategoryDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CategoryRepository @Inject constructor(
    private val api: CategoryApi
) {
    suspend fun getCategories(type: String? = null): Result<List<CategoryDto>> {
        return try {
            val response = api.getCategories(type)
            if (response.isSuccessful) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to fetch categories: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSubCategories(categoryId: Long): Result<List<SubCategoryDto>> {
        return try {
            val response = api.getSubCategories(categoryId)
            if (response.isSuccessful) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to fetch subcategories: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getItems(subCategoryId: Long): Result<List<ItemDto>> {
        return try {
            val response = api.getItems(subCategoryId)
            if (response.isSuccessful) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception("Failed to fetch items: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
