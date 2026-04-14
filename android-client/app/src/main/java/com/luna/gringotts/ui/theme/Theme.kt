package com.luna.gringotts.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = VaultEmerald,
    onPrimary = VaultOnPrimary,
    primaryContainer = VaultEmeraldContainer,
    onPrimaryContainer = VaultEmerald,
    secondary = VaultSurfaceContainerHigh,
    onSecondary = VaultOnSurface,
    tertiary = VaultEmerald,
    background = VaultBackground,
    onBackground = VaultOnSurface,
    surface = VaultSurface,
    onSurface = VaultOnSurface,
    surfaceVariant = VaultSurfaceContainerHigh,
    onSurfaceVariant = VaultOnSurfaceVariant,
    outlineVariant = VaultOutlineVariant,
    error = VaultError,
    onError = VaultOnPrimary,
    surfaceContainerLow = VaultSurfaceContainerLow,
    surfaceContainerHigh = VaultSurfaceContainerHigh,
    surfaceContainerHighest = VaultSurfaceContainerHighest
)

@Composable
fun GringottsTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = AppTypography,
        content = content
    )
}
