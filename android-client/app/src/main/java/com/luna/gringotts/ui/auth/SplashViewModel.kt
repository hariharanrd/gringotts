package com.luna.gringotts.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.luna.gringotts.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<SplashState>(SplashState.Loading)
    val uiState: StateFlow<SplashState> = _uiState

    init {
        checkAuth()
    }

    private fun checkAuth() {
        viewModelScope.launch {
            // Attempt silent refresh using stored trust token
            val success = authRepository.silentRefresh()
            if (success) {
                _uiState.value = SplashState.NavigateToHome
            } else {
                _uiState.value = SplashState.NavigateToLogin
            }
        }
    }
}

sealed class SplashState {
    object Loading : SplashState()
    object NavigateToHome : SplashState()
    object NavigateToLogin : SplashState()
}
