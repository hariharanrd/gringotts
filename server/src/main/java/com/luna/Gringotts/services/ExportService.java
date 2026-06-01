package com.luna.Gringotts.services;

import com.luna.Gringotts.records.*;
import com.opencsv.CSVWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExportService {

    private static final String[] HEADERS = {
        "ID", "Date", "Type", "Description", "Amount", "Category", 
        "Sub-Category", "Item", "Payment Mode", "Notes", "Direction", 
        "Status", "Reference No", "Imported", "Include in Budget"
    };

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] exportAsCsv(List<Transaction> transactions) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // Write UTF-8 BOM prefix for Excel compatibility
            out.write(0xEF);
            out.write(0xBB);
            out.write(0xBF);

            try (CSVWriter writer = new CSVWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {
                writer.writeNext(HEADERS);

                for (Transaction t : transactions) {
                    writer.writeNext(new String[]{
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
                        t.getImported() != null && t.getImported() ? "Yes" : "No",
                        t.getIncludeInBudget() != null && t.getIncludeInBudget() ? "Yes" : "No"
                    });
                }
            }
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export CSV", e);
        }
    }

    public byte[] exportAsXlsx(List<Transaction> transactions) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            XSSFSheet sheet = workbook.createSheet("Transactions");
            
            // Create professional styling
            // 1. Header Style
            XSSFCellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(new XSSFColor(new java.awt.Color(30, 41, 59), null)); // Slate 800
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            
            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.LEFT);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            
            // Thin borders for header
            headerStyle.setBorderBottom(BorderStyle.MEDIUM);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // 2. Data Row Styling (with borders)
            XSSFCellStyle borderStyle = workbook.createCellStyle();
            borderStyle.setBorderBottom(BorderStyle.THIN);
            borderStyle.setBorderTop(BorderStyle.THIN);
            borderStyle.setBorderLeft(BorderStyle.THIN);
            borderStyle.setBorderRight(BorderStyle.THIN);
            borderStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // 3. Amount Style
            XSSFCellStyle amountStyle = workbook.createCellStyle();
            amountStyle.cloneStyleFrom(borderStyle);
            XSSFDataFormat format = workbook.createDataFormat();
            amountStyle.setDataFormat(format.getFormat("#,##0.00"));
            amountStyle.setAlignment(HorizontalAlignment.RIGHT);

            // 4. Date Style
            XSSFCellStyle dateStyle = workbook.createCellStyle();
            dateStyle.cloneStyleFrom(borderStyle);
            dateStyle.setDataFormat(format.getFormat("yyyy-mm-dd hh:mm:ss"));
            dateStyle.setAlignment(HorizontalAlignment.LEFT);

            // Create Header Row
            XSSFRow headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(24);
            for (int i = 0; i < HEADERS.length; i++) {
                XSSFCell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Transaction t : transactions) {
                XSSFRow row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(20);

                // Column 0: ID
                XSSFCell cellId = row.createCell(0);
                cellId.setCellValue(t.getId());
                cellId.setCellStyle(borderStyle);

                // Column 1: Date
                XSSFCell cellDate = row.createCell(1);
                if (t.getTransactionTime() != null) {
                    cellDate.setCellValue(t.getTransactionTime().format(DATE_FORMATTER));
                } else {
                    cellDate.setCellValue("");
                }
                cellDate.setCellStyle(dateStyle);

                // Column 2: Type
                XSSFCell cellType = row.createCell(2);
                cellType.setCellValue(getTransactionType(t));
                cellType.setCellStyle(borderStyle);

                // Column 3: Description
                XSSFCell cellDesc = row.createCell(3);
                cellDesc.setCellValue(t.getDescription() != null ? t.getDescription() : "");
                cellDesc.setCellStyle(borderStyle);

                // Column 4: Amount
                XSSFCell cellAmt = row.createCell(4);
                cellAmt.setCellValue(t.getValue() != null ? t.getValue() : 0.0);
                cellAmt.setCellStyle(amountStyle);

                // Column 5: Category
                XSSFCell cellCat = row.createCell(5);
                cellCat.setCellValue(t.getCategory() != null ? t.getCategory().getName() : "");
                cellCat.setCellStyle(borderStyle);

                // Column 6: Sub-Category
                XSSFCell cellSubCat = row.createCell(6);
                cellSubCat.setCellValue(t.getSubCategory() != null ? t.getSubCategory().getName() : "");
                cellSubCat.setCellStyle(borderStyle);

                // Column 7: Item
                XSSFCell cellItem = row.createCell(7);
                cellItem.setCellValue(t.getItem() != null ? t.getItem().getName() : "");
                cellItem.setCellStyle(borderStyle);

                // Column 8: Payment Mode
                XSSFCell cellPayMode = row.createCell(8);
                cellPayMode.setCellValue(t.getPaymentMode() != null ? t.getPaymentMode() : "");
                cellPayMode.setCellStyle(borderStyle);

                // Column 9: Notes
                XSSFCell cellNotes = row.createCell(9);
                cellNotes.setCellValue(t.getNotes() != null ? t.getNotes() : "");
                cellNotes.setCellStyle(borderStyle);

                // Column 10: Direction
                XSSFCell cellDir = row.createCell(10);
                cellDir.setCellValue(getDirection(t));
                cellDir.setCellStyle(borderStyle);

                // Column 11: Status
                XSSFCell cellStatus = row.createCell(11);
                cellStatus.setCellValue(getStatus(t));
                cellStatus.setCellStyle(borderStyle);

                // Column 12: Reference No
                XSSFCell cellRef = row.createCell(12);
                cellRef.setCellValue(t.getReferenceNo() != null ? t.getReferenceNo() : "");
                cellRef.setCellStyle(borderStyle);

                // Column 13: Imported
                XSSFCell cellImported = row.createCell(13);
                cellImported.setCellValue(t.getImported() != null && t.getImported() ? "Yes" : "No");
                cellImported.setCellStyle(borderStyle);

                // Column 14: Include in Budget
                XSSFCell cellBudget = row.createCell(14);
                cellBudget.setCellValue(t.getIncludeInBudget() != null && t.getIncludeInBudget() ? "Yes" : "No");
                cellBudget.setCellStyle(borderStyle);
            }

            // Auto-size all columns to fit content beautifully
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, currentWidth + 1024);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export XLSX", e);
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
}
