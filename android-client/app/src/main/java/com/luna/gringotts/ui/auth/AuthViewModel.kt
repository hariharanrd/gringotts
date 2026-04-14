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
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthState>(AuthState.Idle)
    val uiState: StateFlow<AuthState> = _uiState

    fun preAuthenticate(username: String, password: String) {
        _uiState.value = AuthState.Loading
        viewModelScope.launch {
            authRepository.preAuthenticate(username, password)
                .onSuccess { preAuthToken ->
                    if (preAuthToken.isEmpty()) {
                        // MFA was bypassed implicitly (trust token was used or not required)
                        _uiState.value = AuthState.Success
                    } else {
                        // Pass token to MFA screen
                        _uiState.value = AuthState.RequiresMfa(preAuthToken)
                    }
                }
                .onFailure { error ->
                    _uiState.value = AuthState.Error(error.message ?: "Login failed")
                }
        }
    }

    fun authenticate(preAuthToken: String, code: String) {
        val intCode = code.toIntOrNull()
        if (intCode == null) {
            _uiState.value = AuthState.Error("Invalid code format")
            return
        }

        _uiState.value = AuthState.Loading
        viewModelScope.launch {
            authRepository.authenticate(preAuthToken, intCode)
                .onSuccess {
                    _uiState.value = AuthState.Success
                }
                .onFailure { error ->
                    // Return back to MFA state on failure so they can try again
                    _uiState.value = AuthState.RequiresMfa(preAuthToken, error.message)
                }
        }
    }

    fun resetState() {
        _uiState.value = AuthState.Idle
    }
}

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class RequiresMfa(val preAuthToken: String, val error: String? = null) : AuthState()
    object Success : AuthState()
    data class Error(val message: String) : AuthState()
}
