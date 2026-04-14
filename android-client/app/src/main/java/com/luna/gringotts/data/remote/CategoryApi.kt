package com.luna.gringotts.data.remote

import com.luna.gringotts.data.remote.model.CategoryDto
import com.luna.gringotts.data.remote.model.ItemDto
import com.luna.gringotts.data.remote.model.PaginatedResponse
import com.luna.gringotts.data.remote.model.SubCategoryDto
import retrofit2.Response
import retrofit2.http.*

interface CategoryApi {
    @GET("api/v1/categories")
    suspend fun getCategories(
        @Query("type") type: String? = null
    ): Response<PaginatedResponse<CategoryDto>>

    @GET("api/v1/categories/{categoryId}/subcategories")
    suspend fun getSubCategories(
        @Path("categoryId") categoryId: Long
    ): Response<PaginatedResponse<SubCategoryDto>>

    @GET("api/v1/subcategories/{subCategoryId}/items")
    suspend fun getItems(
        @Path("subCategoryId") subCategoryId: Long
    ): Response<PaginatedResponse<ItemDto>>

    @POST("api/v1/categories")
    suspend fun addCategory(@Body category: CategoryDto): Response<Map<String, Any>>

    @POST("api/v1/subcategories")
    suspend fun addSubCategory(@Body subCategory: SubCategoryDto): Response<Map<String, Any>>

    @POST("api/v1/items")
    suspend fun addItem(@Body item: ItemDto): Response<Map<String, Any>>

    @DELETE("api/v1/categories/{id}")
    suspend fun deleteCategory(@Path("id") id: Long): Response<Map<String, Any>>

    @DELETE("api/v1/subcategories/{id}")
    suspend fun deleteSubCategory(@Path("id") id: Long): Response<Map<String, Any>>

    @DELETE("api/v1/items/{id}")
    suspend fun deleteItem(@Path("id") id: Long): Response<Map<String, Any>>
}
