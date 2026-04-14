package com.luna.gringotts.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.luna.gringotts.ui.auth.*

object Routes {
    const val SPLASH = "splash"
    const val LOGIN = "login"
    const val MFA = "mfa/{token}"
    const val DASHBOARD = "dashboard"
    const val TRANSACTION_LIST = "transactions/{type}"
    const val ADD_TRANSACTION = "addTransaction/{type}"
    const val BUDGETS = "budgets"
    const val CATEGORIES = "categories"
    
    fun mfa(token: String) = "mfa/$token"
    fun transactionList(type: String) = "transactions/$type"
    fun addTransaction(type: String) = "addTransaction/$type"
}

@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Routes.SPLASH
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Routes.SPLASH) {
            SplashScreen(
                onNavigateToHome = {
                    navController.navigate(Routes.DASHBOARD) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.LOGIN) {
            val viewModel: AuthViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsState()
            val state = uiState // Capture for smart casting

            when (state) {
                is AuthState.RequiresMfa -> {
                    val token = state.preAuthToken
                    navController.navigate(Routes.mfa(token))
                }
                is AuthState.Success -> {
                    navController.navigate(Routes.DASHBOARD) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
                else -> {
                    LoginScreen(
                        uiState = state,
                        onLoginSubmit = { username, password ->
                            viewModel.preAuthenticate(username, password)
                        },
                        errorMsg = (state as? AuthState.Error)?.message
                    )
                }
            }
        }

        composable(
            route = Routes.MFA,
            arguments = listOf(androidx.navigation.navArgument("token") { type = androidx.navigation.NavType.StringType })
        ) { backStackEntry ->
            val token = backStackEntry.arguments?.getString("token") ?: ""
            val viewModel: AuthViewModel = hiltViewModel()
            val uiState by viewModel.uiState.collectAsState()
            val state = uiState // Capture for smart casting

            when (state) {
                is AuthState.Success -> {
                    navController.navigate(Routes.DASHBOARD) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
                else -> {
                    MfaScreen(
                        uiState = state,
                        onMfaSubmit = { code ->
                            viewModel.authenticate(token, code)
                        },
                        onBackToLogin = {
                            navController.popBackStack(Routes.LOGIN, false)
                        },
                        errorMsg = (state as? AuthState.Error)?.message ?: (state as? AuthState.RequiresMfa)?.error
                    )
                }
            }
        }

        composable(Routes.DASHBOARD) {
            com.luna.gringotts.ui.dashboard.DashboardScreen(
                onNavigateToList = { type ->
                    navController.navigate(Routes.transactionList(type))
                },
                onNavigateToBudgets = {
                    navController.navigate(Routes.BUDGETS)
                },
                onNavigateToCategories = {
                    navController.navigate(Routes.CATEGORIES)
                },
                onAddClick = {
                    navController.navigate(Routes.addTransaction("EXPENSE"))
                }
            )
        }

        composable(
            route = Routes.TRANSACTION_LIST,
            arguments = listOf(androidx.navigation.navArgument("type") { type = androidx.navigation.NavType.StringType })
        ) { backStackEntry ->
            val type = backStackEntry.arguments?.getString("type") ?: "EXPENSE"
            com.luna.gringotts.ui.transaction.list.TransactionListScreen(
                type = type,
                onBack = { navController.popBackStack() },
                onAddClick = { txType -> navController.navigate(Routes.addTransaction(txType)) }
            )
        }

        composable(
            route = Routes.ADD_TRANSACTION,
            arguments = listOf(androidx.navigation.navArgument("type") { type = androidx.navigation.NavType.StringType })
        ) { backStackEntry ->
            val type = backStackEntry.arguments?.getString("type") ?: "EXPENSE"
            com.luna.gringotts.ui.transaction.add.AddTransactionScreen(
                initialType = type,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.BUDGETS) {
            com.luna.gringotts.ui.budget.BudgetManagementScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.CATEGORIES) {
            com.luna.gringotts.ui.categories.CategoriesManagementScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
}
