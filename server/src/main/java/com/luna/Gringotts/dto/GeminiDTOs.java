package com.luna.Gringotts.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

public class GeminiDTOs {

    public static class ChatMessageHistory {
        private String role;
        private String content;

        public ChatMessageHistory() {}

        public ChatMessageHistory(String role, String content) {
            this.role = role;
            this.content = content;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    public static class AIChatRequest {
        private String message;
        private List<ChatMessageHistory> chatHistory;

        public AIChatRequest() {}

        public AIChatRequest(String message, List<ChatMessageHistory> chatHistory) {
            this.message = message;
            this.chatHistory = chatHistory;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public List<ChatMessageHistory> getChatHistory() {
            return chatHistory;
        }

        public void setChatHistory(List<ChatMessageHistory> chatHistory) {
            this.chatHistory = chatHistory;
        }
    }

    public static class AIChatResponse {
        private String goblinResponse;
        private Map<String, Object> actionPayload;

        public AIChatResponse() {}

        public AIChatResponse(String goblinResponse, Map<String, Object> actionPayload) {
            this.goblinResponse = goblinResponse;
            this.actionPayload = actionPayload;
        }

        public String getGoblinResponse() {
            return goblinResponse;
        }

        public void setGoblinResponse(String goblinResponse) {
            this.goblinResponse = goblinResponse;
        }

        public Map<String, Object> getActionPayload() {
            return actionPayload;
        }

        public void setActionPayload(Map<String, Object> actionPayload) {
            this.actionPayload = actionPayload;
        }
    }

    public static class FinancialInsightsResponse {
        private String insights;

        public FinancialInsightsResponse() {}

        public FinancialInsightsResponse(String insights) {
            this.insights = insights;
        }

        public String getInsights() {
            return insights;
        }

        public void setInsights(String insights) {
            this.insights = insights;
        }
    }

    public static class InteractionsApiRequest {
        private String model;
        private String input;

        public InteractionsApiRequest() {}

        public InteractionsApiRequest(String model, String input) {
            this.model = model;
            this.input = input;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public String getInput() {
            return input;
        }

        public void setInput(String input) {
            this.input = input;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class InteractionsApiResponse {
        private String id;
        private String status;
        private List<Step> steps;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public List<Step> getSteps() {
            return steps;
        }

        public void setSteps(List<Step> steps) {
            this.steps = steps;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Step {
        private String type;
        private List<ContentItem> content;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public List<ContentItem> getContent() {
            return content;
        }

        public void setContent(List<ContentItem> content) {
            this.content = content;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ContentItem {
        private String type;
        private String text;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }
}
