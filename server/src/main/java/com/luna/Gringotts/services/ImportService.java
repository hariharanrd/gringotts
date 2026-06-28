package com.luna.Gringotts.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luna.Gringotts.records.ImportJob;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.ImportJobRepository;
import com.opencsv.CSVReader;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class ImportService {

    @Autowired
    private ImportJobRepository importJobRepository;

    @Autowired
    private ImportProcessingService importProcessingService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> previewFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null) fileName = "";

        List<String> headers = new ArrayList<>();
        String format;

        try {
            if (fileName.toLowerCase().endsWith(".csv")) {
                format = "CSV";
                try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
                    String[] headerRow = reader.readNext();
                    if (headerRow != null && headerRow.length > 0) {
                        // Strip BOM if present
                        if (headerRow[0].startsWith("\uFEFF")) {
                            headerRow[0] = headerRow[0].substring(1);
                        }
                        for (String h : headerRow) {
                            headers.add(h.trim());
                        }
                    }
                }
            } else {
                format = "XLSX";
                try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
                    Sheet sheet = workbook.getSheetAt(0);
                    Row headerRow = sheet.getRow(0);
                    if (headerRow != null) {
                        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                            Cell cell = headerRow.getCell(i);
                            headers.add(cell != null ? cell.toString().trim() : "");
                        }
                    }
                }
            }

            if (headers.isEmpty()) {
                throw new IllegalArgumentException("No columns detected in header row.");
            }

            // Create suggested mappings
            Map<String, Integer> suggestedMapping = new HashMap<>();
            List<String> targetFields = List.of(
                "date", "type", "description", "amount", "category",
                "sub_category", "item", "payment_mode", "notes",
                "direction", "status", "reference_no", "include_in_budget"
            );

            for (String target : targetFields) {
                suggestedMapping.put(target, findBestMatch(target, headers));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("detected_headers", headers);
            result.put("suggested_mapping", suggestedMapping);
            result.put("format", format);
            return result;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse header preview: " + e.getMessage(), e);
        }
    }

    public ImportJob submitImportJob(MultipartFile file, String strategy,
                                     String columnMappingJson, User user) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }

        String fileName = file.getOriginalFilename();
        String format = (fileName != null && fileName.toLowerCase().endsWith(".csv")) ? "CSV" : "XLSX";

        try {
            // Validate mapping JSON format
            objectMapper.readTree(columnMappingJson);

            // Read complete file into memory to pass to background thread
            byte[] fileBytes = file.getBytes();

            ImportJob job = new ImportJob();
            job.setUser(user);
            job.setFileName(fileName);
            job.setFormat(format);
            job.setStrategy(strategy);
            job.setColumnMapping(columnMappingJson);
            job.setStatus(ImportJob.ImportJobStatus.PENDING);

            ImportJob savedJob = importJobRepository.save(job);

            // Trigger asynchronous processing
            importProcessingService.processAsync(savedJob.getId(), fileBytes, format, strategy, columnMappingJson, user.getId());

            return savedJob;

        } catch (Exception e) {
            throw new RuntimeException("Failed to submit import job: " + e.getMessage(), e);
        }
    }

    private String normalize(String str) {
        if (str == null) return "";
        return str.toLowerCase()
                .replaceAll("[^a-z0-9]", "")
                .trim();
    }

    private Integer findBestMatch(String targetField, List<String> headers) {
        String normTarget = normalize(targetField);
        for (int i = 0; i < headers.size(); i++) {
            String normHeader = normalize(headers.get(i));
            if (normHeader.equals(normTarget)) {
                return i;
            }
            // Fuzzy alias mappings
            if (normTarget.equals("date") && (normHeader.equals("transactiontime") || normHeader.equals("time"))) {
                return i;
            }
            if (normTarget.equals("description") && normHeader.equals("desc")) {
                return i;
            }
            if (normTarget.equals("amount") && (normHeader.equals("value") || normHeader.equals("val") || normHeader.equals("amt"))) {
                return i;
            }
            if (normTarget.equals("paymentmode") && (normHeader.equals("mode") || normHeader.equals("paymode"))) {
                return i;
            }
            if (normTarget.equals("referenceno") && (normHeader.equals("referencenumber") || normHeader.equals("refno") || normHeader.equals("ref"))) {
                return i;
            }
            if (normTarget.equals("includeinbudget") && normHeader.equals("budget")) {
                return i;
            }
        }
        return -1;
    }
}
