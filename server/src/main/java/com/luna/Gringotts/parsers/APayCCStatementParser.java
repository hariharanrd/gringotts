package com.luna.Gringotts.parsers;



import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.utils.FileUtil;
import com.luna.Gringotts.utils.GTTable;

import java.text.ParseException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.List;

public class APayCCStatementParser extends StatementParser {

    private static final String DATE_FORMAT = "dd/MM/yyyy";

    public APayCCStatementParser(String statementFile) {
        super(statementFile);
    }

    @Override
    public void parse() throws Exception {
        GTTable result = FileUtil.readCSV(statementFile);
        Iterator<List<Object>> rows = result.getRows();
        boolean start = false;
        while(rows.hasNext()){
            List<Object> row = rows.next();
            if(row.stream().anyMatch("Transaction Date"::equals)){
                start = true;
                continue;
            }
            if(start){
                if(isValidDate(row.get(2).toString().replace(",","/"))){
                    transactions.add(getTransaction(row));
                }
            }
        }

    }

    private Transaction getTransaction(List<Object> row) throws ParseException {
        LocalDate date = LocalDate.parse(row.get(2).toString().trim().replace(",","/"), DateTimeFormatter.ofPattern(DATE_FORMAT));
        String description = row.get(3).toString().trim() + "(APay ICICI CC)";
        String refNo = row.get(9).toString().trim();
        String valueStr = row.get(6).toString();
        boolean isDebit = valueStr.contains("Dr.");
        Double value = Double.valueOf(valueStr.substring(0,valueStr.indexOf(isDebit?" Dr.":" Cr.")).replace(",",""));
        Transaction t;
        if(isDebit){
            t = new Expense(refNo, date.atTime(LocalTime.MIDNIGHT), description, value, Expense.ExpenseMode.CREDIT_CARD);
        }else{
            t = new Income(refNo, date.atTime(LocalTime.MIDNIGHT), description, value);
            if(!description.contains("BBPS Payment received")){
                t.setDescription("From Amazon Pay Credit Card");
            }
        }
        return t;
    }

    @Override
    protected String getDateFormat(String date) {
        return DATE_FORMAT;
    }
}
