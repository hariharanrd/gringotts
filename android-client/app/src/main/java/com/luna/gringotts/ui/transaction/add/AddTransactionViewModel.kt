package com.luna.gringotts.ui.transaction.add

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.luna.gringotts.data.remote.model.CategoryDto
import com.luna.gringotts.data.remote.model.CategoryRef
import com.luna.gringotts.data.remote.model.SubCategoryDto
import com.luna.gringotts.data.remote.model.SubCategoryRef
import com.luna.gringotts.data.remote.model.TransactionRequest
import com.luna.gringotts.data.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@HiltViewModel
class AddTransactionViewModel @Inject constructor(
    private val repository: TransactionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddTransactionState())
    val uiState: StateFlow<AddTransactionState> = _uiState.asStateFlow()

    fun loadCategories(type: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingCategories = true)
            repository.getCategories(type).onSuccess { categories ->
                _uiState.value = _uiState.value.copy(
                    categories = categories,
                    isLoadingCategories = false
                )
            }.onFailure {
                _uiState.value = _uiState.value.copy(
                    isLoadingCategories = false,
                    error = it.message
                )
            }
        }
    }

    fun onCategorySelected(categoryId: Long) {
        val selectedCat = _uiState.value.categories.find { it.id == categoryId }
        _uiState.value = _uiState.value.copy(
            selectedCategory = selectedCat,
            selectedSubCategory = null,
            subCategories = emptyList()
        )
        if (categoryId != -1L) {
            loadSubCategories(categoryId)
        }
    }

    private fun loadSubCategories(categoryId: Long) {
        viewModelScope.launch {
            repository.getSubCategories(categoryId).onSuccess { subCats ->
                _uiState.value = _uiState.value.copy(subCategories = subCats)
            }
        }
    }

    fun onSubCategorySelected(subCategoryId: Long) {
        val selectedSub = _uiState.value.subCategories.find { it.id == subCategoryId }
        _uiState.value = _uiState.value.copy(selectedSubCategory = selectedSub)
    }

    fun saveTransaction(
        type: String,
        amount: Double,
        description: String,
        notes: String,
        date: LocalDateTime,
        paymentMode: String?,
        source: String?
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null)
            val request = TransactionRequest(
                value = amount,
                description = description,
                transactionTime = date.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                category = _uiState.value.selectedCategory?.let { CategoryRef(it.id) },
                subCategory = _uiState.value.selectedSubCategory?.let { SubCategoryRef(it.id) },
                notes = notes.takeIf { it.isNotBlank() },
                paymentMode = paymentMode.takeIf { type == "EXPENSE" && it?.isNotBlank() == true },
                source = source.takeIf { type == "INCOME" && it?.isNotBlank() == true }
            )

            repository.addTransaction(type, request).onSuccess {
                _uiState.value = _uiState.value.copy(isSaving = false, saveSuccess = true)
            }.onFailure {
                _uiState.value = _uiState.value.copy(isSaving = false, error = it.message)
            }
        }
    }

    fun resetSuccess() {
        _uiState.value = _uiState.value.copy(saveSuccess = false)
    }
    
    fun resetError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

data class AddTransactionState(
    val categories: List<CategoryDto> = emptyList(),
    val subCategories: List<SubCategoryDto> = emptyList(),
    val selectedCategory: CategoryDto? = null,
    val selectedSubCategory: SubCategoryDto? = null,
    val isLoadingCategories: Boolean = false,
    val isSaving: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null
)
