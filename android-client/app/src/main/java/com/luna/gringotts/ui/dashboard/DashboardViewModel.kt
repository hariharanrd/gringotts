package com.luna.gringotts.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.luna.gringotts.data.remote.model.DashboardSummary
import com.luna.gringotts.data.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: TransactionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<DashboardState>(DashboardState.Loading)
    val uiState: StateFlow<DashboardState> = _uiState

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        _uiState.value = DashboardState.Loading
        viewModelScope.launch {
            repository.getDashboardSummary()
                .onSuccess { summary ->
                    _uiState.value = DashboardState.Success(summary)
                }
                .onFailure { error ->
                    _uiState.value = DashboardState.Error(error.message ?: "Failed to load dashboard")
                }
        }
    }
}

sealed class DashboardState {
    object Loading : DashboardState()
    data class Success(val summary: DashboardSummary) : DashboardState()
    data class Error(val message: String) : DashboardState()
}
