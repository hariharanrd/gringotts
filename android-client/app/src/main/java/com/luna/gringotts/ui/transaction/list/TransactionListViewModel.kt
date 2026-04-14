package com.luna.gringotts.ui.transaction.list

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.luna.gringotts.data.remote.model.TransactionDto
import com.luna.gringotts.data.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TransactionListViewModel @Inject constructor(
    private val repository: TransactionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<TransactionListState>(TransactionListState.Loading)
    val uiState: StateFlow<TransactionListState> = _uiState

    private var currentType = "EXPENSE"
    private var currentPage = 1
    private var hasMore = true
    private val transactions = mutableListOf<TransactionDto>()
    private var isLoading = false

    fun loadTransactions(type: String, refresh: Boolean = false) {
        if (refresh) {
            currentPage = 1
            hasMore = true
            transactions.clear()
            _uiState.value = TransactionListState.Loading
        } else if (isLoading || !hasMore) {
            return
        }

        currentType = type
        isLoading = true

        viewModelScope.launch {
            val result = when (type.uppercase()) {
                "INCOME" -> repository.getIncomes(currentPage)
                "SAVING" -> repository.getSavings(currentPage)
                else -> repository.getExpenses(currentPage)
            }

            result.onSuccess { response ->
                transactions.addAll(response.data)
                hasMore = response.has_more
                currentPage++
                _uiState.value = TransactionListState.Success(
                    transactions = transactions.toList(),
                    hasMore = hasMore,
                    type = currentType
                )
            }.onFailure { error ->
                if (transactions.isEmpty()) {
                    _uiState.value = TransactionListState.Error(error.message ?: "Unknown error")
                }
            }
            isLoading = false
        }
    }

    fun deleteTransaction(id: Long) {
        viewModelScope.launch {
            repository.deleteTransaction(id).onSuccess {
                transactions.removeAll { it.id == id }
                _uiState.value = TransactionListState.Success(
                    transactions = transactions.toList(),
                    hasMore = hasMore,
                    type = currentType
                )
            }
        }
    }
}

sealed class TransactionListState {
    object Loading : TransactionListState()
    data class Success(val transactions: List<TransactionDto>, val hasMore: Boolean, val type: String) : TransactionListState()
    data class Error(val message: String) : TransactionListState()
}
