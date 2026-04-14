package com.luna.gringotts.ui.categories

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.luna.gringotts.data.remote.model.CategoryDto
import com.luna.gringotts.data.remote.model.ItemDto
import com.luna.gringotts.data.remote.model.SubCategoryDto
import com.luna.gringotts.data.repository.CategoryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class CategoriesState {
    object Loading : CategoriesState()
    data class Success(
        val categories: List<CategoryDto>,
        val subCategories: List<SubCategoryDto> = emptyList(),
        val items: List<ItemDto> = emptyList(),
        val selectedCategoryId: Long? = null,
        val selectedSubCategoryId: Long? = null
    ) : CategoriesState()
    data class Error(val message: String) : CategoriesState()
}

@HiltViewModel
class CategoryManagementViewModel @Inject constructor(
    private val repository: CategoryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<CategoriesState>(CategoriesState.Loading)
    val uiState: StateFlow<CategoriesState> = _uiState.asStateFlow()

    init {
        loadCategories()
    }

    fun loadCategories() {
        viewModelScope.launch {
            _uiState.value = CategoriesState.Loading
            repository.getCategories()
                .onSuccess { _uiState.value = CategoriesState.Success(categories = it) }
                .onFailure { _uiState.value = CategoriesState.Error(it.message ?: "Unknown error") }
        }
    }

    fun selectCategory(categoryId: Long) {
        val currentState = _uiState.value
        if (currentState is CategoriesState.Success) {
            viewModelScope.launch {
                repository.getSubCategories(categoryId)
                    .onSuccess { 
                        _uiState.value = currentState.copy(
                            selectedCategoryId = categoryId,
                            subCategories = it,
                            selectedSubCategoryId = null,
                            items = emptyList()
                        )
                    }
            }
        }
    }

    fun selectSubCategory(subCategoryId: Long) {
        val currentState = _uiState.value
        if (currentState is CategoriesState.Success) {
            viewModelScope.launch {
                repository.getItems(subCategoryId)
                    .onSuccess {
                        _uiState.value = currentState.copy(
                            selectedSubCategoryId = subCategoryId,
                            items = it
                        )
                    }
            }
        }
    }
}
