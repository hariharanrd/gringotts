package com.luna.Gringotts.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luna.Gringotts.records.*;
import com.luna.Gringotts.records.ImportJob.ImportJobStatus;
import com.luna.Gringotts.repository.*;
import com.opencsv.CSVReader;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.CacheManager;

import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ImportProcessingService {

    @Autowired
    private ImportJobRepository importJobRepository;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private IncomeRepository incomeRepository;

    @Autowired
    private SavingRepository savingRepository;

    @Autowired
    private RevolvingRepository revolvingRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private interface RowData {
        String getCell(int index);
        int getRowNum();
    }

    private static class CSVRowData implements RowData {
        private final String[] row;
        private final int rowNum;

        public CSVRowData(String[] row, int rowNum) {
            this.row = row;
            this.rowNum = rowNum;
        }

        @Override
        public String getCell(int index) {
            if (index < 0 || index >= row.length) return "";
            return row[index];
        }

        @Override
        public int getRowNum() {
            return rowNum;
        }
    }

    private static class ExcelRowData implements RowData {
        private final Row row;

        public ExcelRowData(Row row) {
            this.row = row;
        }

        @Override
        public String getCell(int index) {
            if (index < 0) return "";
            Cell cell = row.getCell(index);
            return getExcelCellString(cell);
        }

        @Override
        public int getRowNum() {
            return row.getRowNum() + 1; // 1-indexed for user display
        }

        private String getExcelCellString(Cell cell) {
            if (cell == null) return "";
            switch (cell.getCellType()) {
                case STRING:
                    return cell.getStringCellValue();
                case NUMERIC:
                    if (DateUtil.isCellDateFormatted(cell)) {
                        LocalDateTime ldt = cell.getLocalDateTimeCellValue();
                        if (ldt != null) {
                            return ldt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                        }
                    }
                    double num = cell.getNumericCellValue();
                    if (num == (long) num) {
                        return String.valueOf((long) num);
                    }
                    return String.valueOf(num);
                case BOOLEAN:
                    return String.valueOf(cell.getBooleanCellValue());
                case FORMULA:
                    try {
                        return cell.getStringCellValue();
                    } catch (Exception e) {
                        try {
                            return String.valueOf(cell.getNumericCellValue());
                        } catch (Exception ex) {
                            return "";
                        }
                    }
                case BLANK:
                default:
                    return "";
            }
        }
    }

    @Async("importExecutor")
    @Transactional
    public void processAsync(Long jobId, byte[] fileBytes, String format,
                             String strategy, String columnMappingJson, Long userId) {
        ImportJob job = importJobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        job.setStatus(ImportJobStatus.PROCESSING);
        importJobRepository.saveAndFlush(job);

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            job.setStatus(ImportJobStatus.FAILED);
            job.setErrorMessage("User not found");
            importJobRepository.save(job);
            return;
        }

        List<Map<String, Object>> failedRowsList = new ArrayList<>();
        int importedCount = 0;
        int failedCount = 0;
        boolean csiCreated = false;

        try {
            Map<String, Integer> mapping = objectMapper.readValue(columnMappingJson, new TypeReference<Map<String, Integer>>() {});
            List<RowData> rows = new ArrayList<>();

            boolean rowsSkipped = false;
            // Parse File Rows
            if ("CSV".equalsIgnoreCase(format)) {
                try (CSVReader reader = new CSVReader(new InputStreamReader(new ByteArrayInputStream(fileBytes), StandardCharsets.UTF_8))) {
                    List<String[]> allRows = reader.readAll();
                    if (allRows.isEmpty()) {
                        throw new IllegalArgumentException("The uploaded file is empty.");
                    }
                    // Skip header row
                    for (int i = 1; i < allRows.size(); i++) {
                        if (rows.size() >= 3000) {
                            rowsSkipped = true;
                            break;
                        }
                        rows.add(new CSVRowData(allRows.get(i), i + 1));
                    }
                }
            } else {
                try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(fileBytes))) {
                    Sheet sheet = workbook.getSheetAt(0);
                    int rowCount = sheet.getPhysicalNumberOfRows();
                    if (rowCount <= 1) {
                        throw new IllegalArgumentException("The uploaded file is empty or contains only headers.");
                    }
                    // Skip header row (index 0)
                    for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                        if (rows.size() >= 3000) {
                            rowsSkipped = true;
                            break;
                        }
                        Row row = sheet.getRow(i);
                        if (row != null) {
                            rows.add(new ExcelRowData(row));
                        }
                    }
                }
            }

            if (rowsSkipped) {
                failedRowsList.add(Map.of(
                    "row", "System",
                    "reason", "Import limited to a maximum of 3000 rows. Remaining rows were skipped."
                ));
                failedCount++;
            }

            // Local cache to avoid DB lookup roundtrips and JPA flush duplicate races
            Map<String, Category> catCache = new HashMap<>();
            Map<String, SubCategory> subCatCache = new HashMap<>();
            Map<String, Item> itemCache = new HashMap<>();

            List<Transaction> transactionsToSave = new ArrayList<>();

            for (RowData row : rows) {
                try {
                    // Extract values using column mapping indices
                    String dateVal = getMappedValue(row, mapping, "date");
                    String typeVal = getMappedValue(row, mapping, "type");
                    String descVal = getMappedValue(row, mapping, "description");
                    String amtVal = getMappedValue(row, mapping, "amount");

                    // Validation
                    if (dateVal.isEmpty() || typeVal.isEmpty() || descVal.isEmpty() || amtVal.isEmpty()) {
                        throw new IllegalArgumentException("Missing required fields (Date, Type, Description, or Amount).");
                    }

                    LocalDateTime transactionTime = parseDateTime(dateVal);
                    String transactionType = typeVal.trim().toUpperCase();
                    if (!List.of("EXPENSE", "INCOME", "SAVING", "REVOLVING").contains(transactionType)) {
                        throw new IllegalArgumentException("Invalid transaction type: " + typeVal);
                    }

                    Double value;
                    try {
                        value = Double.parseDouble(amtVal.trim().replaceAll(",", ""));
                    } catch (NumberFormatException e) {
                        throw new IllegalArgumentException("Invalid amount format: " + amtVal);
                    }

                    // Optional CSI fields
                    String catName = getMappedValue(row, mapping, "category");
                    String subCatName = getMappedValue(row, mapping, "sub_category");
                    String itemName = getMappedValue(row, mapping, "item");

                    Category category = null;
                    SubCategory subCategory = null;
                    Item item = null;

                    if (!catName.isEmpty()) {
                        String catKey = catName.trim().toLowerCase();
                        category = catCache.get(catKey);
                        if (category == null) {
                            category = categoryRepository.findByNameIgnoreCaseAndUser(catName, user).orElse(null);
                            if (category == null) {
                                if ("CREATE_IF_MISSING".equalsIgnoreCase(strategy)) {
                                    category = new Category();
                                    category.setName(catName.trim());
                                    category.setType(transactionType);
                                    category.setUser(user);
                                    category = categoryRepository.saveAndFlush(category);
                                    catCache.put(catKey, category);
                                    csiCreated = true;
                                } else {
                                    throw new IllegalArgumentException("Category '" + catName + "' does not exist.");
                                }
                            } else {
                                catCache.put(catKey, category);
                            }
                        }

                        if (category != null && !subCatName.isEmpty()) {
                            String subCatKey = category.getId() + ":" + subCatName.trim().toLowerCase();
                            subCategory = subCatCache.get(subCatKey);
                            if (subCategory == null) {
                                subCategory = subCategoryRepository.findByNameIgnoreCaseAndCategoryId(subCatName, category.getId()).orElse(null);
                                if (subCategory == null) {
                                    if ("CREATE_IF_MISSING".equalsIgnoreCase(strategy)) {
                                        subCategory = new SubCategory();
                                        subCategory.setName(subCatName.trim());
                                        subCategory.setCategory(category);
                                        subCategory = subCategoryRepository.saveAndFlush(subCategory);
                                        subCatCache.put(subCatKey, subCategory);
                                        csiCreated = true;
                                    } else {
                                        throw new IllegalArgumentException("Sub-Category '" + subCatName + "' does not exist under '" + catName + "'.");
                                    }
                                } else {
                                    subCatCache.put(subCatKey, subCategory);
                                }
                            }

                            if (subCategory != null && !itemName.isEmpty()) {
                                String itemKey = subCategory.getId() + ":" + itemName.trim().toLowerCase();
                                item = itemCache.get(itemKey);
                                if (item == null) {
                                    item = itemRepository.findByNameIgnoreCaseAndSubCategoryId(itemName, subCategory.getId()).orElse(null);
                                    if (item == null) {
                                        if ("CREATE_IF_MISSING".equalsIgnoreCase(strategy)) {
                                            item = new Item();
                                            item.setName(itemName.trim());
                                            item.setSubCategory(subCategory);
                                            item = itemRepository.saveAndFlush(item);
                                            itemCache.put(itemKey, item);
                                            csiCreated = true;
                                        } else {
                                            throw new IllegalArgumentException("Item '" + itemName + "' does not exist under '" + subCatName + "'.");
                                        }
                                    } else {
                                        itemCache.put(itemKey, item);
                                    }
                                }
                            }
                        }
                    }

                    // Optional fields
                    String paymentMode = getMappedValue(row, mapping, "payment_mode");
                    String notes = getMappedValue(row, mapping, "notes");
                    String direction = getMappedValue(row, mapping, "direction");
                    String statusVal = getMappedValue(row, mapping, "status");
                    String refNo = getMappedValue(row, mapping, "reference_no");
                    String budgetVal = getMappedValue(row, mapping, "include_in_budget");

                    Transaction t;
                    if ("EXPENSE".equals(transactionType)) {
                        Expense exp = new Expense();
                        if (!paymentMode.isEmpty()) exp.setPaymentMode(paymentMode);
                        t = exp;
                    } else if ("INCOME".equals(transactionType)) {
                        Income inc = new Income();
                        t = inc;
                    } else if ("SAVING".equals(transactionType)) {
                        Saving sav = new Saving();
                        sav.setIsIn(!"Out".equalsIgnoreCase(direction));
                        t = sav;
                    } else {
                        Revolving rev = new Revolving();
                        rev.setIsGive(!"Received".equalsIgnoreCase(direction));
                        rev.setClosed("Closed".equalsIgnoreCase(statusVal));
                        t = rev;
                    }

                    t.setUser(user);
                    t.setValue(value);
                    t.setDescription(descVal);
                    t.setTransactionTime(transactionTime);
                    t.setCategory(category);
                    t.setSubCategory(subCategory);
                    t.setItem(item);
                    t.setNotes(notes.isEmpty() ? null : notes);
                    t.setReferenceNo(refNo.isEmpty() ? null : refNo);
                    t.setImported(true);

                    // include_in_budget logic
                    if ("INCOME".equals(transactionType)) {
                        t.setIncludeInBudget(true);
                    } else {
                        t.setIncludeInBudget(budgetVal.isEmpty() || !"No".equalsIgnoreCase(budgetVal));
                    }

                    transactionsToSave.add(t);
                    importedCount++;

                } catch (Exception e) {
                    failedCount++;
                    failedRowsList.add(Map.of(
                        "row", row.getRowNum(),
                        "reason", e.getMessage() != null ? e.getMessage() : "Unknown validation error"
                    ));
                }
            }

            // Bulk Save successfully parsed transactions
            if (!transactionsToSave.isEmpty()) {
                // Save using their specialized entity tables
                for (Transaction t : transactionsToSave) {
                    if (t instanceof Expense exp) {
                        expenseRepository.save(exp);
                    } else if (t instanceof Income inc) {
                        incomeRepository.save(inc);
                    } else if (t instanceof Saving sav) {
                        savingRepository.save(sav);
                    } else if (t instanceof Revolving rev) {
                        revolvingRepository.save(rev);
                    }
                }
            }

            job.setStatus(ImportJobStatus.COMPLETED);
            job.setImportedCount(importedCount);
            job.setFailedCount(failedCount);
            if (!failedRowsList.isEmpty()) {
                job.setFailedRows(objectMapper.writeValueAsString(failedRowsList));
            }

        } catch (Exception e) {
            job.setStatus(ImportJobStatus.FAILED);
            job.setErrorMessage("Import process failed: " + e.getMessage());
        } finally {
            if (csiCreated) {
                clearCsiCaches();
            }
            job.setCompletedAt(LocalDateTime.now());
            importJobRepository.save(job);
        }
    }

    private void clearCsiCaches() {
        if (cacheManager != null) {
            List.of("categories", "categoryById", "subCategories", "subCategoryById", "items", "itemById")
                .forEach(cacheName -> {
                    var cache = cacheManager.getCache(cacheName);
                    if (cache != null) {
                        cache.clear();
                    }
                });
        }
    }

    private String getMappedValue(RowData row, Map<String, Integer> mapping, String fieldKey) {
        Integer colIndex = mapping.get(fieldKey);
        if (colIndex == null || colIndex == -1) return "";
        return row.getCell(colIndex).trim();
    }

    private LocalDateTime parseDateTime(String val) {
        if (val == null || val.trim().isEmpty()) return null;
        val = val.trim();
        List<DateTimeFormatter> formatters = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")
        );
        for (DateTimeFormatter f : formatters) {
            try {
                return LocalDateTime.parse(val, f);
            } catch (Exception e) {}
        }
        List<DateTimeFormatter> dateFormatters = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy")
        );
        for (DateTimeFormatter f : dateFormatters) {
            try {
                return java.time.LocalDate.parse(val, f).atStartOfDay();
            } catch (Exception e) {}
        }
        throw new IllegalArgumentException("Invalid date format: " + val);
    }
}
