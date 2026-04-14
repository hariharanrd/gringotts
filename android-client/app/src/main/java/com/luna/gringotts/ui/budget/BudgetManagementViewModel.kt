package com.luna.gringotts.ui.budget

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.luna.gringotts.data.remote.model.BudgetDto
import com.luna.gringotts.data.remote.model.BudgetUtilizationDto
import com.luna.gringotts.data.repository.BudgetRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class BudgetState {
    object Loading : BudgetState()
    data class Success(
        val activeBudget: BudgetDto?,
        val utilization: BudgetUtilizationDto?
    ) : BudgetState()
    data class Error(val message: String) : BudgetState()
}

@HiltViewModel
class BudgetManagementViewModel @Inject constructor(
    private val repository: BudgetRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<BudgetState>(BudgetState.Loading)
    val uiState: StateFlow<BudgetState> = _uiState.asStateFlow()

    init {
        loadBudgetData()
    }

    fun loadBudgetData() {
        viewModelScope.launch {
            _uiState.value = BudgetState.Loading
            
            val budgetResult = repository.getActiveBudget()
            val utilResult = repository.getActiveBudgetUtilization()
            
            if (budgetResult.isSuccess && utilResult.isSuccess) {
                _uiState.value = BudgetState.Success(
                    activeBudget = budgetResult.getOrNull(),
                    utilization = utilResult.getOrNull()
                )
            } else {
                _uiState.value = BudgetState.Error("Failed to load budget data")
            }
        }
    }
}
