package com.luna.gringotts.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun VaultVolumeBar(
    progress: Float,
    modifier: Modifier = Modifier,
    height: Dp = 12.dp,
    color: Color = MaterialTheme.colorScheme.primary,
    trackColor: Color = MaterialTheme.colorScheme.surfaceContainerHighest
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 1000),
        label = "VolumeBarProgress"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clip(CircleShape)
            .background(trackColor)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(animatedProgress)
                .fillMaxHeight()
                .clip(CircleShape)
                .background(color)
        )
    }
}

@Composable
fun VaultGradientButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    text: String,
    style: TextStyle = MaterialTheme.typography.titleMedium
) {
    val gradient = Brush.linearGradient(
        colors = listOf(
            MaterialTheme.colorScheme.primary,
            MaterialTheme.colorScheme.primaryContainer
        )
    )

    Button(
        onClick = onClick,
        modifier = modifier
            .height(56.dp)
            .background(
                brush = if (enabled) gradient else Brush.linearGradient(
                    listOf(
                        MaterialTheme.colorScheme.outlineVariant,
                        MaterialTheme.colorScheme.outlineVariant
                    )
                ),
                shape = RoundedCornerShape(28.dp)
            ),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            disabledContainerColor = Color.Transparent
        ),
        enabled = enabled,
        shape = RoundedCornerShape(28.dp),
        contentPadding = PaddingValues()
    ) {
        Text(
            text = text,
            style = style,
            color = if (enabled) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun VaultGradientFAB(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: @Composable () -> Unit
) {
    val gradient = Brush.linearGradient(
        colors = listOf(
            MaterialTheme.colorScheme.primary,
            MaterialTheme.colorScheme.primaryContainer
        )
    )

    Surface(
        onClick = onClick,
        modifier = modifier
            .size(56.dp),
        shape = CircleShape,
        color = Color.Transparent
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(gradient),
            contentAlignment = Alignment.Center
        ) {
            CompositionLocalProvider(LocalContentColor provides MaterialTheme.colorScheme.onPrimary) {
                icon()
            }
        }
    }
}

@Composable
fun VaultBlurredText(
    text: String,
    isBlurred: Boolean,
    style: TextStyle,
    color: Color,
    modifier: Modifier = Modifier
) {
    Text(
        text = text,
        style = style,
        color = color,
        modifier = modifier.blur(if (isBlurred) 12.dp else 0.dp)
    )
}
