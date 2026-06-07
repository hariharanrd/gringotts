package com.luna.Gringotts.services;

import com.luna.Gringotts.records.*;
import com.luna.Gringotts.repository.*;
import com.opencsv.CSVWriter;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ZohoAnalyticsService {

    @Autowired
    private ZohoIntegrationRepository zohoIntegrationRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private TransactionRepository<Transaction> transactionRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    // In-memory cache for access tokens: userId -> CachedToken
    private final Map<Long, CachedToken> tokenCache = new ConcurrentHashMap<>();

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static class CachedToken {
        String token;
        LocalDateTime expiry;

        CachedToken(String token, int expiresInSeconds) {
            this.token = token;
            this.expiry = LocalDateTime.now().plusSeconds(expiresInSeconds - 300); // 5 mins buffer
        }

        boolean isValid() {
            return LocalDateTime.now().isBefore(expiry);
        }
    }

    private String getAccountsUrl(String dataCenter) {
        return "https://accounts.zoho." + dataCenter;
    }

    private String getAnalyticsUrl(String dataCenter) {
        return "https://analyticsapi.zoho." + dataCenter;
    }

    /**
     * Validates Zoho credentials by executing a test token refresh and checking workspace existence.
     */
    /**
     * Retrieves the first organization ID associated with the Zoho Analytics account.
     */
    public String getOrgId(String dataCenter, String accessToken) {
        String url = getAnalyticsUrl(dataCenter) + "/restapi/v2/orgs";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Zoho-oauthtoken " + accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Map<String, Object> dataNode = (Map<String, Object>) body.get("data");
                if (dataNode != null) {
                    List<Map<String, Object>> orgs = (List<Map<String, Object>>) dataNode.get("orgs");
                    if (orgs != null && !orgs.isEmpty()) {
                        return String.valueOf(orgs.get(0).get("orgId"));
                    }
                }
            }
            throw new RuntimeException("No organization found in Zoho Analytics. Please ensure your account has a default organization.");
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve Zoho Org ID: " + e.getMessage(), e);
        }
    }

    /**
     * Validates Zoho credentials by executing a test token refresh and checking workspace existence.
     */
    public Map<String, Object> validateCredentials(String clientId, String clientSecret, String refreshToken, String dataCenter, String workspaceName) {
        String url = getAccountsUrl(dataCenter) + "/oauth/v2/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "refresh_token");
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        map.add("refresh_token", refreshToken);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (body.containsKey("error")) {
                    throw new RuntimeException("Zoho authentication error: " + body.get("error"));
                }
                String accessToken = (String) body.get("access_token");

                // Validate Org ID
                String orgId = getOrgId(dataCenter, accessToken);

                // Validate if workspace exists
                getWorkspaceId(dataCenter, accessToken, workspaceName, orgId);

                return body;
            } else {
                throw new RuntimeException("Failed to refresh token: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    /**
     * Gets a cached access token for the user, refreshing it if expired.
     */
    public String getAccessToken(ZohoIntegration integration) {
        if (integration.getAccessToken() != null && 
            integration.getAccessTokenExpiresAt() != null && 
            LocalDateTime.now().isBefore(integration.getAccessTokenExpiresAt().minusMinutes(5))) {
            return integration.getAccessToken();
        }

        String url = getAccountsUrl(integration.getDataCenter()) + "/oauth/v2/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "refresh_token");
        map.add("client_id", integration.getClientId());
        map.add("client_secret", integration.getClientSecret());
        map.add("refresh_token", integration.getRefreshToken());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (body.containsKey("error")) {
                    throw new RuntimeException("Zoho token refresh error: " + body.get("error"));
                }
                String token = (String) body.get("access_token");
                Number expiresIn = (Number) body.get("expires_in");
                int seconds = expiresIn != null ? expiresIn.intValue() : 3600;

                integration.setAccessToken(token);
                integration.setAccessTokenExpiresAt(LocalDateTime.now().plusSeconds(seconds));
                zohoIntegrationRepository.save(integration);

                return token;
            } else {
                throw new RuntimeException("Failed to refresh token: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to obtain Zoho access token: " + e.getMessage(), e);
        }
    }

    /**
     * Finds the target workspace ID by name.
     */
    /**
     * Finds the target workspace ID by name.
     */
    public String getWorkspaceId(String dataCenter, String accessToken, String workspaceName, String orgId) {
        String url = getAnalyticsUrl(dataCenter) + "/restapi/v2/workspaces";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Zoho-oauthtoken " + accessToken);
        headers.set("ZANALYTICS-ORGID", orgId);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Map<String, Object> dataNode = (Map<String, Object>) body.get("data");
                if (dataNode != null) {
                    List<Map<String, Object>> owned = (List<Map<String, Object>>) dataNode.get("ownedWorkspaces");
                    if (owned != null) {
                        for (Map<String, Object> ws : owned) {
                            if (workspaceName.equalsIgnoreCase((String) ws.get("workspaceName"))) {
                                return String.valueOf(ws.get("workspaceId"));
                            }
                        }
                    }
                    List<Map<String, Object>> shared = (List<Map<String, Object>>) dataNode.get("sharedWorkspaces");
                    if (shared != null) {
                        for (Map<String, Object> ws : shared) {
                            if (workspaceName.equalsIgnoreCase((String) ws.get("workspaceName"))) {
                                return String.valueOf(ws.get("workspaceId"));
                            }
                        }
                    }
                }
                throw new RuntimeException("Workspace '" + workspaceName + "' not found in your Zoho Analytics account. Please create it first in Zoho.");
            } else {
                throw new RuntimeException("Failed to list workspaces: " + response.getStatusCode());
            }
        } catch (Exception e) {
            if (e instanceof RuntimeException && e.getMessage().contains("not found in your Zoho Analytics account")) {
                throw e;
            }
            throw new RuntimeException("Failed to retrieve Zoho Workspace: " + e.getMessage(), e);
        }
    }

    /**
     * Lists existing tables in the workspace.
     */
    public Map<String, String> getTablesInWorkspace(String dataCenter, String accessToken, String workspaceId, String orgId) {
        String baseUrl = getAnalyticsUrl(dataCenter) + "/restapi/v2/workspaces/" + workspaceId + "/views";

        JSONObject configJson = new JSONObject();
        configJson.put("viewTypes", new JSONArray().put("0"));

        String url = UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("CONFIG", "{config}")
                .build()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Zoho-oauthtoken " + accessToken);
        headers.set("ZANALYTICS-ORGID", orgId);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        Map<String, String> tableMap = new HashMap<>();
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    request,
                    Map.class,
                    configJson.toString()
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Map<String, Object> dataNode = (Map<String, Object>) body.get("data");
                if (dataNode != null) {
                    List<Map<String, Object>> views = (List<Map<String, Object>>) dataNode.get("views");
                        if (views != null) {
                            for (Map<String, Object> view : views) {
                                String viewName = (String) view.get("viewName");
                                String viewId = String.valueOf(view.get("viewId"));
                                tableMap.put(viewName, viewId);
                            }
                        }
                    }
                }
        } catch (Exception e) {
            System.err.println("Warning: Listing views failed: " + e.getMessage());
        }
        return tableMap;
    }

    public void ensureTableExists(String dataCenter, String accessToken, String workspaceId, String orgId, String tableName, String configJson, Map<String, String> existingTables) {
        if (existingTables.containsKey(tableName)) {
            return;
        }

        String url = getAnalyticsUrl(dataCenter) + "/restapi/v2/workspaces/" + workspaceId + "/tables";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Zoho-oauthtoken " + accessToken);
        headers.set("ZANALYTICS-ORGID", orgId);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("CONFIG", configJson);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Create table failed with status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to create table " + tableName + ": " + e.getMessage(), e);
        }
    }

    /**
     * Performs a multipart/form-data data import.
     */
    public void importData(String dataCenter, String accessToken, String workspaceId, String orgId, String viewId, byte[] csvBytes, String importType) {
        String url = getAnalyticsUrl(dataCenter) + "/restapi/v2/workspaces/" + workspaceId + "/views/" + viewId + "/data";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Zoho-oauthtoken " + accessToken);
        headers.set("ZANALYTICS-ORGID", orgId);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        ByteArrayResource fileResource = new ByteArrayResource(csvBytes) {
            @Override
            public String getFilename() {
                return "data.csv";
            }
        };
        body.add("FILE", fileResource);

        String configJson = String.format(
                "{\"importType\":\"%s\",\"fileType\":\"csv\",\"autoIdentify\":false,\"onError\":\"skiprow\",\"dateFormat\":\"yyyy-MM-dd HH:mm:ss\"}",
                importType
        );
        body.add("CONFIG", configJson);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Import request returned status code: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload data chunk: " + e.getMessage(), e);
        }
    }

    /**
     * Run full sync for a user.
     */
    public void syncAll(User user) {
        ZohoIntegration integration = zohoIntegrationRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Zoho Integration is not configured for this user"));

        try {
            String accessToken = getAccessToken(integration);
            String orgId = getOrgId(integration.getDataCenter(), accessToken);
            String workspaceId = getWorkspaceId(integration.getDataCenter(), accessToken, integration.getWorkspaceName(), orgId);

            // 1. Fetch current tables list
            Map<String, String> existingTables = getTablesInWorkspace(integration.getDataCenter(), accessToken, workspaceId, orgId);

            // 2. Ensure all 4 tables exist
            ensureTableConfigurations(integration.getDataCenter(), accessToken, workspaceId, orgId, existingTables);

            // Re-fetch tables to map the newly created table names to IDs
            existingTables = getTablesInWorkspace(integration.getDataCenter(), accessToken, workspaceId, orgId);

            LocalDateTime syncStartTime = LocalDateTime.now();
            LocalDateTime lastSynced = integration.getLastSyncedAt();

            // 3. Sync Categories
            syncCategories(integration, accessToken, workspaceId, orgId, existingTables.get("GT_Categories"), user);

            // 4. Sync Sub-Categories
            syncSubCategories(integration, accessToken, workspaceId, orgId, existingTables.get("GT_SubCategories"), user);

            // 5. Sync Items
            syncItems(integration, accessToken, workspaceId, orgId, existingTables.get("GT_Items"), user);

            // 6. Sync Transactions (incremental sync)
            syncTransactions(integration, accessToken, workspaceId, orgId, existingTables.get("GT_Transactions"), user, lastSynced);

            // Update success status
            integration.setLastSyncedAt(syncStartTime);
            integration.setLastSyncError(null);
            zohoIntegrationRepository.save(integration);

        } catch (Exception e) {
            integration.setLastSyncError(e.getMessage());
            zohoIntegrationRepository.save(integration);
            throw e;
        }
    }

    private void ensureTableConfigurations(String dc, String token, String wsId, String orgId, Map<String, String> existing) {
        // Categories design
        String catJson = "{\"tableDesign\":{\"TABLENAME\":\"GT_Categories\",\"TABLEDESCRIPTION\":\"Gringotts Categories Lookup\",\"COLUMNS\":[{\"COLUMNNAME\":\"id\",\"DATATYPE\":\"NUMBER\",\"MANDATORY\":true},{\"COLUMNNAME\":\"name\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":true},{\"COLUMNNAME\":\"description\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"icon\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"color\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false}]}}";
        ensureTableExists(dc, token, wsId, orgId, "GT_Categories", catJson, existing);

        // SubCategories design
        String subCatJson = "{\"tableDesign\":{\"TABLENAME\":\"GT_SubCategories\",\"TABLEDESCRIPTION\":\"Gringotts Sub-Categories Lookup\",\"COLUMNS\":[{\"COLUMNNAME\":\"id\",\"DATATYPE\":\"NUMBER\",\"MANDATORY\":true},{\"COLUMNNAME\":\"name\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":true},{\"COLUMNNAME\":\"description\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"category_id\",\"DATATYPE\":\"NUMBER\",\"MANDATORY\":false},{\"COLUMNNAME\":\"category_name\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false}]}}";
        ensureTableExists(dc, token, wsId, orgId, "GT_SubCategories", subCatJson, existing);

        // Items design
        String itemJson = "{\"tableDesign\":{\"TABLENAME\":\"GT_Items\",\"TABLEDESCRIPTION\":\"Gringotts Items Lookup\",\"COLUMNS\":[{\"COLUMNNAME\":\"id\",\"DATATYPE\":\"NUMBER\",\"MANDATORY\":true},{\"COLUMNNAME\":\"name\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":true},{\"COLUMNNAME\":\"description\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"subcategory_id\",\"DATATYPE\":\"NUMBER\",\"MANDATORY\":false},{\"COLUMNNAME\":\"subcategory_name\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false}]}}";
        ensureTableExists(dc, token, wsId, orgId, "GT_Items", itemJson, existing);

        // Transactions design
        String txJson = "{\"tableDesign\":{\"TABLENAME\":\"GT_Transactions\",\"TABLEDESCRIPTION\":\"Gringotts Transactions Data\",\"COLUMNS\":[{\"COLUMNNAME\":\"id\",\"DATATYPE\":\"NUMBER\",\"MANDATORY\":true},{\"COLUMNNAME\":\"date\",\"DATATYPE\":\"DATE\",\"MANDATORY\":true},{\"COLUMNNAME\":\"type\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":true},{\"COLUMNNAME\":\"description\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"amount\",\"DATATYPE\":\"DECIMAL_NUMBER\",\"MANDATORY\":true},{\"COLUMNNAME\":\"category_name\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"subcategory_name\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"item_name\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"payment_mode\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"notes\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"direction\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"status\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"reference_no\",\"DATATYPE\":\"PLAIN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"imported\",\"DATATYPE\":\"BOOLEAN\",\"MANDATORY\":false},{\"COLUMNNAME\":\"include_in_budget\",\"DATATYPE\":\"BOOLEAN\",\"MANDATORY\":false}]}}";
        ensureTableExists(dc, token, wsId, orgId, "GT_Transactions", txJson, existing);
    }

    private void syncCategories(ZohoIntegration integration, String token, String wsId, String orgId, String viewId, User user) {
        List<Category> categories = categoryRepository.findAllByUser(user);
        if (categories.isEmpty()) return;

        String[] headers = {"id", "name", "description", "icon", "color"};
        List<String[]> rows = new ArrayList<>();
        for (Category c : categories) {
            rows.add(new String[]{
                    String.valueOf(c.getId()),
                    c.getName(),
                    c.getDescription() != null ? c.getDescription() : "",
                    c.getIcon() != null ? c.getIcon() : "",
                    c.getColor() != null ? c.getColor() : ""
            });
        }

        byte[] csv = writeCsv(headers, rows);
        importData(integration.getDataCenter(), token, wsId, orgId, viewId, csv, "updateadd");
    }

    private void syncSubCategories(ZohoIntegration integration, String token, String wsId, String orgId, String viewId, User user) {
        List<SubCategory> subCategories = subCategoryRepository.findByCategoryUser(user);
        if (subCategories.isEmpty()) return;

        String[] headers = {"id", "name", "description", "category_id", "category_name"};
        List<String[]> rows = new ArrayList<>();
        for (SubCategory s : subCategories) {
            rows.add(new String[]{
                    String.valueOf(s.getId()),
                    s.getName(),
                    s.getDescription() != null ? s.getDescription() : "",
                    s.getCategory() != null ? String.valueOf(s.getCategory().getId()) : "",
                    s.getCategory() != null ? s.getCategory().getName() : ""
            });
        }

        byte[] csv = writeCsv(headers, rows);
        importData(integration.getDataCenter(), token, wsId, orgId, viewId, csv, "updateadd");
    }

    private void syncItems(ZohoIntegration integration, String token, String wsId, String orgId, String viewId, User user) {
        List<Item> items = itemRepository.findBySubCategoryCategoryUser(user);
        if (items.isEmpty()) return;

        String[] headers = {"id", "name", "description", "subcategory_id", "subcategory_name"};
        List<String[]> rows = new ArrayList<>();
        for (Item item : items) {
            rows.add(new String[]{
                    String.valueOf(item.getId()),
                    item.getName(),
                    item.getDescription() != null ? item.getDescription() : "",
                    item.getSubCategory() != null ? String.valueOf(item.getSubCategory().getId()) : "",
                    item.getSubCategory() != null ? item.getSubCategory().getName() : ""
            });
        }

        byte[] csv = writeCsv(headers, rows);
        importData(integration.getDataCenter(), token, wsId, orgId, viewId, csv, "updateadd");
    }

    private void syncTransactions(ZohoIntegration integration, String token, String wsId, String orgId, String viewId, User user, LocalDateTime lastSynced) {
        List<Transaction> transactions;
        if (lastSynced == null) {
            transactions = transactionRepository.findByUser(user);
        } else {
            transactions = transactionRepository.findByUserAndCreatedAtAfter(user, lastSynced);
        }

        if (transactions.isEmpty()) return;

        String[] headers = {
                "id", "date", "type", "description", "amount", "category_name",
                "subcategory_name", "item_name", "payment_mode", "notes", "direction",
                "status", "reference_no", "imported", "include_in_budget"
        };
        List<String[]> rows = new ArrayList<>();
        for (Transaction t : transactions) {
            rows.add(new String[]{
                    String.valueOf(t.getId()),
                    t.getTransactionTime() != null ? t.getTransactionTime().format(DATE_FORMATTER) : "",
                    getTransactionType(t),
                    t.getDescription() != null ? t.getDescription() : "",
                    String.valueOf(t.getValue()),
                    t.getCategory() != null ? t.getCategory().getName() : "",
                    t.getSubCategory() != null ? t.getSubCategory().getName() : "",
                    t.getItem() != null ? t.getItem().getName() : "",
                    t.getPaymentMode() != null ? t.getPaymentMode() : "",
                    t.getNotes() != null ? t.getNotes() : "",
                    getDirection(t),
                    getStatus(t),
                    t.getReferenceNo() != null ? t.getReferenceNo() : "",
                    t.getImported() != null && t.getImported() ? "true" : "false",
                    t.getIncludeInBudget() != null && t.getIncludeInBudget() ? "true" : "false"
            });
        }

        byte[] csv = writeCsv(headers, rows);
        importData(integration.getDataCenter(), token, wsId, orgId, viewId, csv, "append");
    }

    private byte[] writeCsv(String[] headers, List<String[]> rows) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // UTF-8 BOM prefix
            out.write(0xEF);
            out.write(0xBB);
            out.write(0xBF);

            try (OutputStreamWriter osw = new OutputStreamWriter(out, StandardCharsets.UTF_8);
                 CSVWriter writer = new CSVWriter(osw)) {
                writer.writeNext(headers);
                for (String[] row : rows) {
                    writer.writeNext(row);
                }
            }
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize CSV for Zoho Analytics bulk sync", e);
        }
    }

    private String getTransactionType(Transaction t) {
        if (t instanceof Expense) return "EXPENSE";
        if (t instanceof Income) return "INCOME";
        if (t instanceof Saving) return "SAVING";
        if (t instanceof Revolving) return "REVOLVING";
        return "TRANSACTION";
    }

    private String getDirection(Transaction t) {
        if (t instanceof Saving s) {
            return Boolean.TRUE.equals(s.getIsIn()) ? "In" : "Out";
        }
        if (t instanceof Revolving r) {
            return Boolean.TRUE.equals(r.getIsGive()) ? "Given" : "Received";
        }
        return "";
    }

    private String getStatus(Transaction t) {
        if (t instanceof Revolving r) {
            return Boolean.TRUE.equals(r.getClosed()) ? "Closed" : "Active";
        }
        return "";
    }

    /**
     * Daily sync cron job running every night at 1:00 AM.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void dailySync() {
        List<ZohoIntegration> integrations = zohoIntegrationRepository.findAll();
        for (ZohoIntegration integration : integrations) {
            try {
                syncAll(integration.getUser());
            } catch (Exception e) {
                System.err.println("Scheduled Zoho sync failed for user: " + integration.getUser().getUsername() + " - " + e.getMessage());
            }
        }
    }
}