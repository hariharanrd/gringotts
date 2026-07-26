package com.luna.Gringotts.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luna.Gringotts.constants.AIPromptConstants;
import com.luna.Gringotts.dto.GeminiDTOs;
import com.luna.Gringotts.records.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.6-flash}")
    private String model;

    @Value("${gemini.api-url:https://generativelanguage.googleapis.com/v1beta/interactions}")
    private String apiUrl;

    @Value("${ai.provider:gemini}")
    private String aiProvider;

    @Value("${ai.local.url:}")
    private String localUrl;

    @Value("${ai.local.model:}")
    private String localModel;

    @Autowired
    private CSIService csiService;

    @Autowired
    private CreditCardService creditCardService;

    @Autowired
    private TransactionService transactionService;

    @Autowired(required = false)
    private ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public GeminiDTOs.AIChatResponse parseTransactionWithGoblin(GeminiDTOs.AIChatRequest request, User currentUser) {
        if ("gemini".equalsIgnoreCase(aiProvider) && (apiKey == null || apiKey.trim().isEmpty())) {
            String noKeyMsg = "*grumbles* Bah! No Gemini API Key configured in server vault, wizard!";
            Map<String, Object> fallbackPayload = new HashMap<>();
            fallbackPayload.put("action_type", "CONVERSATIONAL");
            fallbackPayload.put("goblin_response", noKeyMsg);
            return new GeminiDTOs.AIChatResponse(noKeyMsg, fallbackPayload);
        }

        try {
            Pageable pageableCsi = PageRequest.of(0, 100);
            List<Category> categories = csiService.getCategories(pageableCsi).getContent();
            List<SubCategory> subCategories = csiService.getAllUserSubCategories(pageableCsi).getContent();
            List<Item> items = csiService.getAllUserItems(pageableCsi).getContent();
            List<CreditCard> creditCards = creditCardService.getAllCardsRaw();

            // Build catalogue JSON
            List<Map<String, Object>> csiCatalogue = categories.stream().<Map<String, Object>>map(cat -> {
                Map<String, Object> catMap = new HashMap<>();
                catMap.put("id", cat.getId());
                catMap.put("name", cat.getName());
                catMap.put("type", cat.getType() != null ? cat.getType() : "EXPENSE");

                List<SubCategory> subs = subCategories.stream()
                        .filter(s -> s.getCategory() != null && s.getCategory().getId().equals(cat.getId()))
                        .collect(Collectors.toList());

                List<Map<String, Object>> subMaps = subs.stream().<Map<String, Object>>map(sub -> {
                    Map<String, Object> subMap = new HashMap<>();
                    subMap.put("id", sub.getId());
                    subMap.put("name", sub.getName());

                    List<Item> subItems = items.stream()
                            .filter(i -> i.getSubCategory() != null && i.getSubCategory().getId().equals(sub.getId()))
                            .collect(Collectors.toList());

                    List<Map<String, Object>> itemMaps = subItems.stream().<Map<String, Object>>map(item -> {
                        Map<String, Object> itemMap = new HashMap<>();
                        itemMap.put("id", item.getId());
                        itemMap.put("name", item.getName());
                        return itemMap;
                    }).collect(Collectors.toList());

                    subMap.put("items", itemMaps);
                    return subMap;
                }).collect(Collectors.toList());

                catMap.put("subcategories", subMaps);
                return catMap;
            }).collect(Collectors.toList());

            // Build credit cards list
            List<Map<String, Object>> cardsList = creditCards.stream().map(card -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", card.getId());
                m.put("card_nickname", card.getNickname());
                m.put("bank_name", card.getIssuer());
                return m;
            }).collect(Collectors.toList());

            // Build chat history string (Limit to LAST 5 MESSAGES ONLY for security & performance)
            StringBuilder historyContext = new StringBuilder();
            if (request.getChatHistory() != null && !request.getChatHistory().isEmpty()) {
                List<GeminiDTOs.ChatMessageHistory> historyList = request.getChatHistory();
                int startIdx = Math.max(0, historyList.size() - 5);
                List<GeminiDTOs.ChatMessageHistory> recentHistory = historyList.subList(startIdx, historyList.size());
                for (GeminiDTOs.ChatMessageHistory msg : recentHistory) {
                    String role = sanitizeInput(msg.getRole());
                    String content = sanitizeInput(msg.getContent());
                    historyContext.append(role).append(": ").append(content).append("\n");
                }
            }

            String todayStr = LocalDate.now().toString();
            String rawUserMsg = request.getMessage() != null ? request.getMessage() : "";
            String sanitizedUserMsg = sanitizeInput(rawUserMsg);

            // Transactions are NOT passed to external LLM to protect user data privacy. LLM returns search criteria.
            String prompt = AIPromptConstants.GOBLIN_SYSTEM_PROMPT_TEMPLATE
                    .replace("{TODAY_DATE}", todayStr)
                    .replace("{CSI_CATALOGUE}", objectMapper.writeValueAsString(csiCatalogue))
                    .replace("{CREDIT_CARDS}", objectMapper.writeValueAsString(cardsList))
                    .replace("{RECENT_TRANSACTIONS}", "[]")
                    .replace("{CHAT_HISTORY}", historyContext.toString())
                    .replace("{USER_MESSAGE}", sanitizedUserMsg);

            String rawLlMOutput = callLLMApi(prompt);
            Map<String, Object> parsed = safeJsonParse(rawLlMOutput);

            if (parsed == null) {
                String fallbackMsg = (rawLlMOutput != null && rawLlMOutput.length() < 200 && !rawLlMOutput.contains("{"))
                        ? rawLlMOutput
                        : "Ah, that request is beyond my vault ledger's reach, wizard! As your Gringotts Bank Teller, I can assist you with:\n" +
                          "• 📝 Logging transactions (e.g., 'Spent 500 on pizza')\n" +
                          "• 🔍 Searching & listing transactions (e.g., 'Show my food expenses', 'List last 5 transactions')\n" +
                          "• ✏️ Updating ledger entries (e.g., 'Change last pizza expense to 650')\n" +
                          "• 🗑️ Deleting transactions (e.g., 'Delete my pizza expense')\n" +
                          "How may I manage your vault today?";
                Map<String, Object> fallbackPayload = new HashMap<>();
                fallbackPayload.put("action_type", "CONVERSATIONAL");
                fallbackPayload.put("goblin_response", fallbackMsg);
                return new GeminiDTOs.AIChatResponse(fallbackMsg, fallbackPayload);
            }

            String goblinResponse = parsed.get("goblin_response") != null
                    ? parsed.get("goblin_response").toString()
                    : "*scritch scritch* I've inspected your entry, wizard!";

            // Resolve target transaction object if target_transaction_id is specified or via search_filter criteria
            Object targetIdObj = parsed.get("target_transaction_id");
            if (targetIdObj != null && !(targetIdObj instanceof String && ((String) targetIdObj).isEmpty())) {
                try {
                    Long targetId = Long.parseLong(targetIdObj.toString());
                    Transaction foundTx = transactionService.getTransactionById(targetId);
                    if (foundTx != null) {
                        parsed.put("target_transaction", foundTx);
                    }
                } catch (NumberFormatException ignored) {}
            }

            // Fallback: If target_transaction is still null for UPDATE/DELETE, try finding match via search_filter criteria
            Object actionTypeObj = parsed.get("action_type");
            String actionTypeStr = actionTypeObj != null ? actionTypeObj.toString() : "";
            if (parsed.get("target_transaction") == null && ("UPDATE".equalsIgnoreCase(actionTypeStr) || "DELETE".equalsIgnoreCase(actionTypeStr))) {
                Object searchFilterObj = parsed.get("search_filter");
                String keywordSearched = "";
                if (searchFilterObj instanceof Map) {
                    Map<?, ?> sf = (Map<?, ?>) searchFilterObj;
                    Object criteriaObj = sf.get("criteria");
                    if (criteriaObj instanceof List && !((List<?>) criteriaObj).isEmpty()) {
                        try {
                            String criteriaJson = objectMapper.writeValueAsString(criteriaObj);
                            List<SearchCriteria> criteriaList = objectMapper.readValue(criteriaJson, new TypeReference<List<SearchCriteria>>() {});
                            
                            for (SearchCriteria sc : criteriaList) {
                                if (sc.getValue() != null && !sc.getValue().toString().trim().isEmpty()) {
                                    keywordSearched = sc.getValue().toString().trim();
                                    break;
                                }
                            }

                            if (!keywordSearched.isEmpty()) {
                                Pageable pageableOne = PageRequest.of(0, 1, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "transactionTime"));
                                Page<Transaction> matches = transactionService.getTransactions(criteriaList, pageableOne);
                                if (matches.hasContent() && !matches.getContent().isEmpty()) {
                                    Transaction target = matches.getContent().get(0);
                                    parsed.put("target_transaction", target);
                                    parsed.put("target_transaction_id", target.getId());
                                }
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to resolve target transaction from criteria", e);
                        }
                    }
                }

                // If target_transaction is still null after criteria search (0 matches found in DB), handle gracefully as CONVERSATIONAL
                if (parsed.get("target_transaction") == null) {
                    String missingMsg = keywordSearched.isEmpty()
                            ? "*adjusts spectacles* I searched the Gringotts ledger, wizard, but found no matching transaction to " + actionTypeStr.toLowerCase() + ". No entry was modified."
                            : "*adjusts spectacles* I searched the Gringotts ledger, wizard, but found no transaction matching '" + keywordSearched + "' to " + actionTypeStr.toLowerCase() + ". No entry was modified.";
                    parsed.put("action_type", "CONVERSATIONAL");
                    parsed.put("goblin_response", missingMsg);
                    goblinResponse = missingMsg;
                }
            }

            return new GeminiDTOs.AIChatResponse(goblinResponse, parsed);

        } catch (Exception e) {
            logger.error("Error in Gemini parseTransactionWithGoblin", e);
            String errStr = e.getMessage() != null ? e.getMessage() : e.toString();
            if (errStr.contains("429") || errStr.contains("RESOURCE_EXHAUSTED") || errStr.contains("quota")) {
                String quotaMsg = "*grumbles loudly* Bah! Gemini API Quota is exhausted (HTTP 429)! Check server GEMINI_API_KEY.";
                Map<String, Object> errPayload = new HashMap<>();
                errPayload.put("action_type", "CONVERSATIONAL");
                errPayload.put("goblin_response", quotaMsg);
                return new GeminiDTOs.AIChatResponse(quotaMsg, errPayload);
            }
            String fallbackMsg = "Ah, that request is beyond my vault ledger's reach, wizard! As your Gringotts Bank Teller, I can assist you with:\n" +
                    "• 📝 Logging transactions (e.g., 'Spent 500 on pizza')\n" +
                    "• 🔍 Searching & listing transactions (e.g., 'Show my food expenses', 'List last 5 transactions')\n" +
                    "• ✏️ Updating ledger entries (e.g., 'Change last pizza expense to 650')\n" +
                    "• 🗑️ Deleting transactions (e.g., 'Delete my pizza expense')\n" +
                    "How may I manage your vault today?";
            Map<String, Object> errPayload = new HashMap<>();
            errPayload.put("action_type", "CONVERSATIONAL");
            errPayload.put("goblin_response", fallbackMsg);
            return new GeminiDTOs.AIChatResponse(fallbackMsg, errPayload);
        }
    }

    private String callLLMApi(String inputPrompt) throws Exception {
        if ("local".equalsIgnoreCase(aiProvider)) {
            return callLocalOllamaApi(inputPrompt);
        }
        return callGeminiInteractionsApi(inputPrompt);
    }

    private String callLocalOllamaApi(String inputPrompt) throws Exception {
        Map<String, Object> requestMap = new HashMap<>();
        requestMap.put("model", localModel);
        requestMap.put("prompt", inputPrompt);
        requestMap.put("stream", false);

        String jsonPayload = objectMapper.writeValueAsString(requestMap);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(localUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (httpResponse.statusCode() >= 400) {
            logger.error("Local AI API returned status code {}: {}", httpResponse.statusCode(), httpResponse.body());
            throw new RuntimeException("Local AI API error (HTTP " + httpResponse.statusCode() + "): " + httpResponse.body());
        }

        Map<String, Object> responseMap = objectMapper.readValue(httpResponse.body(), new TypeReference<Map<String, Object>>() {});
        if (responseMap != null && responseMap.containsKey("response")) {
            return responseMap.get("response").toString();
        } else if (responseMap != null && responseMap.containsKey("choices")) {
            List<?> choices = (List<?>) responseMap.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
                Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
                if (message != null && message.containsKey("content")) {
                    return message.get("content").toString();
                }
            }
        }

        return "";
    }

    private String callGeminiInteractionsApi(String inputPrompt) throws Exception {
        GeminiDTOs.InteractionsApiRequest requestBody = new GeminiDTOs.InteractionsApiRequest(model, inputPrompt);
        String jsonPayload = objectMapper.writeValueAsString(requestBody);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (httpResponse.statusCode() >= 400) {
            logger.error("Gemini API returned status code {}: {}", httpResponse.statusCode(), httpResponse.body());
            throw new RuntimeException("Gemini API error (HTTP " + httpResponse.statusCode() + "): " + httpResponse.body());
        }

        GeminiDTOs.InteractionsApiResponse apiResponse = objectMapper.readValue(httpResponse.body(), GeminiDTOs.InteractionsApiResponse.class);
        if (apiResponse != null && apiResponse.getSteps() != null) {
            for (GeminiDTOs.Step step : apiResponse.getSteps()) {
                if ("model_output".equalsIgnoreCase(step.getType()) && step.getContent() != null) {
                    for (GeminiDTOs.ContentItem contentItem : step.getContent()) {
                        if (contentItem.getText() != null) {
                            return contentItem.getText();
                        }
                    }
                }
            }
        }

        return "";
    }

    private Map<String, Object> safeJsonParse(String text) {
        if (text == null || text.trim().isEmpty()) return null;
        String cleaned = text.trim();
        cleaned = cleaned.replaceAll("(?i)^```json", "").replaceAll("(?i)^```", "").replaceAll("(?i)```$", "").trim();

        try {
            return objectMapper.readValue(cleaned, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ignored) {}

        // Attempt to fix unescaped newlines in JSON strings
        try {
            String fixedNewlines = cleaned.replaceAll("(?<=:\\s*\"[^\"]*)\n(?=[^\"]*\")", "\\\\n");
            return objectMapper.readValue(fixedNewlines, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ignored) {}

        // Extract outer JSON object
        int firstBrace = cleaned.indexOf('{');
        int lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace > firstBrace) {
            try {
                String jsonSub = cleaned.substring(firstBrace, lastBrace + 1);
                return objectMapper.readValue(jsonSub, new TypeReference<Map<String, Object>>() {});
            } catch (Exception ignored) {}
        }

        // Attempt to repair truncated / unclosed JSON
        try {
            String repaired = repairTruncatedJson(cleaned);
            return objectMapper.readValue(repaired, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ignored) {}

        return null;
    }

    private String repairTruncatedJson(String str) {
        String s = str.trim();
        int firstBrace = s.indexOf('{');
        if (firstBrace == -1) return str;
        s = s.substring(firstBrace);

        boolean inString = false;
        boolean isEscaped = false;
        Stack<Character> stack = new Stack<>();

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (isEscaped) {
                isEscaped = false;
                continue;
            }
            if (c == '\\' && inString) {
                isEscaped = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (c == '{' || c == '[') {
                    stack.push(c);
                } else if (c == '}') {
                    if (!stack.isEmpty() && stack.peek() == '{') stack.pop();
                } else if (c == ']') {
                    if (!stack.isEmpty() && stack.peek() == '[') stack.pop();
                }
            }
        }

        StringBuilder sb = new StringBuilder(s);
        if (inString) {
            sb.append('"');
        }

        String trimmed = sb.toString().trim().replaceAll("[:,\\s]+$", "");
        sb = new StringBuilder(trimmed);

        while (!stack.isEmpty()) {
            char open = stack.pop();
            if (open == '{') sb.append('}');
            else if (open == '[') sb.append(']');
        }

        return sb.toString();
    }

    private String sanitizeInput(String input) {
        if (input == null) return "";
        String clean = input.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");
        return clean.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", " ")
                    .replace("\r", " ");
    }
}
