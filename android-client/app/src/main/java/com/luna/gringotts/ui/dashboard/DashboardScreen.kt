package com.luna.gringotts.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import com.luna.gringotts.ui.components.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.luna.gringotts.data.remote.model.TransactionDto
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToList: (String) -> Unit = {},
    onNavigateToBudgets: () -> Unit = {},
    onNavigateToCategories: () -> Unit = {},
    onAddClick: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val isPrivateMode by viewModel.isPrivateMode.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Digital Vault", 
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                        letterSpacing = (-1).sp
                    ) 
                },
                actions = {
                    IconButton(onClick = { viewModel.togglePrivateMode() }) {
                        Icon(
                            imageVector = if (isPrivateMode) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = "Toggle Privacy",
                            tint = if (isPrivateMode) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        },
        floatingActionButton = {
            VaultGradientFAB(
                onClick = onAddClick
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Transaction")
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is DashboardState.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                is DashboardState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadDashboard() }) {
                            Text("Retry")
                        }
                    }
                }
                is DashboardState.Success -> {
                    val summary = state.summary
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp),
                        verticalArrangement = Arrangement.spacedBy(24.dp)
                    ) {
                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                            VaultBalanceSection(
                                amount = summary.totalIncomes - summary.totalExpenses,
                                isPrivateMode = isPrivateMode
                            )
                        }
                        
                        item {
                            VaultQuickActions(
                                onNavigateToBudgets = onNavigateToBudgets,
                                onNavigateToCategories = onNavigateToCategories
                            )
                        }

                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                VaultStatCard(
                                    modifier = Modifier.weight(1f),
                                    title = "Income",
                                    amount = summary.totalIncomes,
                                    isPositive = true,
                                    isPrivateMode = isPrivateMode,
                                    onClick = { onNavigateToList("INCOME") }
                                )
                                VaultStatCard(
                                    modifier = Modifier.weight(1f),
                                    title = "Expenses",
                                    amount = summary.totalExpenses,
                                    isPositive = false,
                                    isPrivateMode = isPrivateMode,
                                    onClick = { onNavigateToList("EXPENSE") }
                                )
                            }
                        }
                        
                        item {
                            Text(
                                "RECENTS", 
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                letterSpacing = 2.sp
                            )
                        }
                        
                        items(summary.recentTransactions) { tx ->
                            VaultTransactionListItem(tx, isPrivateMode = isPrivateMode)
                        }
                        
                        item {
                            Spacer(modifier = Modifier.height(80.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun VaultBalanceSection(amount: Double, isPrivateMode: Boolean) {
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            "TOTAL BALANCE", 
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            letterSpacing = 2.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        VaultBlurredText(
            text = formatter.format(amount), 
            isBlurred = isPrivateMode,
            style = MaterialTheme.typography.displayLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
fun VaultQuickActions(
    onNavigateToBudgets: () -> Unit,
    onNavigateToCategories: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        VaultActionButton(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.AccountBalanceWallet,
            label = "Budgets",
            onClick = onNavigateToBudgets
        )
        VaultActionButton(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.Category,
            label = "Categories",
            onClick = onNavigateToCategories
        )
    }
}

@Composable
fun VaultActionButton(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier.clickable { onClick() },
        color = MaterialTheme.colorScheme.surfaceContainerHigh,
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(icon, contentDescription = label, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(label, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
        }
    }
}

@Composable
fun VaultStatCard(
    modifier: Modifier = Modifier,
    title: String,
    amount: Double,
    isPositive: Boolean,
    isPrivateMode: Boolean,
    onClick: () -> Unit
) {
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    Surface(
        modifier = modifier.clickable { onClick() },
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(12.dp))
            VaultBlurredText(
                text = formatter.format(amount),
                isBlurred = isPrivateMode,
                style = MaterialTheme.typography.titleLarge,
                color = if (isPositive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
fun VaultTransactionListItem(tx: TransactionDto, isPrivateMode: Boolean) {
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    val isIncome = tx.type == "INCOME"
    
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color.Transparent
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = tx.description, 
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = tx.category?.name ?: "Uncategorized", 
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            VaultBlurredText(
                text = (if (isIncome) "+" else "-") + formatter.format(tx.value),
                isBlurred = isPrivateMode,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontFamily = MaterialTheme.typography.displayLarge.fontFamily
                ),
                color = if (isIncome) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
