package com.luna.Gringotts.utils;



import com.opencsv.CSVReader;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

public class FileUtil {

    private static final Logger LOGGER = Logger.getLogger(FileUtil.class.getName());

    public static GTTable readCSV(String csvPath) throws Exception{
        if(!csvPath.endsWith(".csv")){
            throw new Exception ("Invalid csv file");
        }
        GTTable table = new GTTable();
        File file = new File(csvPath);
        CSVReader reader = new CSVReader(new FileReader(file));
        String[] row;
        while((row = reader.readNext())!=null){
            table.addRow(Arrays.stream(row).collect(Collectors.toCollection(ArrayList::new)));
        }
        return table;
    }

    public static GTTable readSheet(String filePath) throws Exception{
        if(!(filePath.endsWith(".xlsx") || filePath.endsWith(".xls"))){
            throw new Exception ("Invalid sheet");
        }
        GTTable table = new GTTable();
        File file = new File(filePath);
        if(file.isFile()) {
            try (FileInputStream fis = new FileInputStream(file)) {
                Sheet sheet;
                if(filePath.endsWith(".xlsx")){
                    sheet = getXLSXSheet(fis);
                } else {
                    sheet = getXLSSheet(fis);
                }
                for (Row row : sheet) {
                    table.addRow(getRowAsList(row));
                }
            } catch (Exception ex) {
                LOGGER.log(Level.SEVERE, "Exception:", ex);
                throw ex;
            }
        }
        return table;
    }

    private static ArrayList<Object> getRowAsList(Row row) {
        ArrayList<Object> rowAsList = new ArrayList<>();
        for (Cell cell : row) {
            CellType type = cell.getCellType();
            switch (type) {
                case STRING: {
                    rowAsList.add(cell.getStringCellValue());
                    break;
                }
                case NUMERIC: {
                    rowAsList.add(cell.getNumericCellValue());
                    break;
                }
                case BOOLEAN:
                    rowAsList.add(cell.getBooleanCellValue());
                    break;
                default: {
                    rowAsList.add("-");
                }
            }
        }
        return rowAsList;
    }

    private static Sheet getXLSXSheet(FileInputStream fis) throws IOException {
        XSSFWorkbook wb = new XSSFWorkbook(fis);
        return wb.getSheetAt(0);
    }

    private static Sheet getXLSSheet(FileInputStream fis) throws IOException {
        HSSFWorkbook wb = new HSSFWorkbook(fis);
        return wb.getSheetAt(0);
    }

    public static void writeToSheet(GTTable data, String filePath) throws Exception {
        if(!filePath.endsWith(".xlsx")){
            throw new Exception("Invalid file path");
        }
        File file = new File(filePath);
        if(!file.exists() && !file.createNewFile()){
            throw new Exception("Unable to create file!!");
        }
        try (XSSFWorkbook workbook = new XSSFWorkbook(file)){
                Sheet sheet = workbook.createSheet("Sheet0");
                int rowNo = 1;
                for(List<Object> rowList : data){
                    Row row = sheet.createRow(rowNo++);
                    int cellNo = 1;
                    for(Object column : rowList){
                        Cell cell = row.createCell(cellNo++);
                        cell.setCellValue(column.toString());
                    }
                }
                try (FileOutputStream fileOut = new FileOutputStream(file)) {
                    workbook.write(fileOut);
                } catch (IOException e) {
                   LOGGER.log(Level.SEVERE, "Exception: ", e);
                }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /*public static void writeToSheet(List<Transaction> transactions, String filePath) throws Exception {
        if(!filePath.endsWith(".xlsx")){
            throw new Exception("Invalid file path");
        }
        File file = new File(filePath);
        if(!file.exists() && !file.createNewFile()){
            throw new Exception("Unable to create file!!");
        }
        try (XSSFWorkbook workbook = new XSSFWorkbook()){
            Sheet sheet = workbook.createSheet("Sheet0");
            Row headerRow = sheet.createRow(0);
            String[] headers = new String[] {"Date", "Description","Ref No","Debit","Credit","Category","Generated Desc","Mode","Rotation","Reviewed"};
            int cellNo = 0;
            for(String header : headers){
                Cell cell = headerRow.createCell(cellNo++);
                cell.setCellValue(header);
            }
            int rowNo = 1;
            CellStyle cellStyle = workbook.createCellStyle();
            CreationHelper createHelper = workbook.getCreationHelper();
            cellStyle.setDataFormat(
                    createHelper.createDataFormat().getFormat("dd MMM yyyy"));

            for(Transaction transaction : transactions){
                Row row = sheet.createRow(rowNo++);
                cellNo = 0;
                Cell cell = row.createCell(cellNo++);
                cell.setCellValue(transaction.getTransactionTime());
                cell.setCellStyle(cellStyle);


                cell = row.createCell(cellNo++);
                cell.setCellValue(transaction.getDescription());

                cell = row.createCell(cellNo++);
                cell.setCellValue(transaction.getRefNo());

                if(transaction.isDebit()) {
                    cell = row.createCell(cellNo++);
                    cell.setCellValue(transaction.getValue());

                    cell = row.createCell(cellNo++);
                    cell.setCellValue("-");
                } else{
                    cell = row.createCell(cellNo++);
                    cell.setCellValue("-");

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(transaction.getValue());
                }
                if(transaction instanceof Expense e){
                    cell = row.createCell(cellNo++);
                    cell.setCellValue("Expense");

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(e.getUserDesc());

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(e.getMode().toString());

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(e.getRotation());

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(Boolean.FALSE);

                } else if (transaction instanceof Income i) {

                    cell = row.createCell(cellNo++);
                    cell.setCellValue("Income");

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(i.getUserDesc());

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(i.getMode().toString());

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(i.getRotation());

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(i.getReviewed());
                } else if (transaction instanceof Savings s) {
                    cell = row.createCell(cellNo++);
                    cell.setCellValue("Savings");

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(s.getUserDesc());

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(s.getMode().toString());

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(Boolean.FALSE);

                    cell = row.createCell(cellNo++);
                    cell.setCellValue(Boolean.FALSE);
                }
            }
            try (FileOutputStream fileOut = new FileOutputStream(file)) {
                workbook.write(fileOut);
            } catch (IOException e) {
                LOGGER.log(Level.SEVERE, "Exception: ", e);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void writeToFile(String filePath, String content) {
        File file = new File(filePath);
        try(BufferedWriter bw = new BufferedWriter(new FileWriter(file))){
            bw.write(content);
            bw.flush();
        }catch (IOException e){
            LOGGER.log(Level.SEVERE, "Exception ", e);
        }
    }*/
}
