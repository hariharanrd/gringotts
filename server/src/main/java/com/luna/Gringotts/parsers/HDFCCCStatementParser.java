package com.luna.Gringotts.parsers;

import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.utils.FileUtil;
import com.luna.Gringotts.utils.GTTable;

import java.text.ParseException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;

public class HDFCCCStatementParser extends StatementParser {

    private static final String DATE_FORMAT = "dd/MM/yyyy HH:mm:ss";
    private static final String DATE_ONLY_FORMAT = "dd/MM/yyyy";

    public HDFCCCStatementParser(String statementFile) {
        super(statementFile);
    }

    @Override
    protected void parse() throws Exception {
        try {
            GTTable table = FileUtil.readSheet(this.statementFile);
            Iterator<List<Object>> rowItr = table.getRows();
            boolean start = false;
            while(rowItr.hasNext()){
                List<Object> row = rowItr.next();
                if(!start && row.stream().anyMatch("Transaction type"::equals)){
                    start = true;
                    continue;
                }
                if(start && row.size()>49){
                    String col1 = row.get(15).toString();
                    if(isValidDate(col1)){
                        transactions.add(getTransaction(row));
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Exception: ", e);
            throw e;
        }
    }

    private Transaction getTransaction(List<Object> row) throws ParseException {
        LocalDateTime date = null;
        try {
            date = LocalDateTime.parse(row.get(15).toString().trim(), DateTimeFormatter.ofPattern(DATE_FORMAT));
        } catch (DateTimeParseException e) {
            date = LocalDate.parse(row.get(15).toString().trim(), DateTimeFormatter.ofPattern(DATE_ONLY_FORMAT)).atTime(LocalTime.MIDNIGHT);
        }
        String description = row.get(19).toString() + "-(HDFC Millenia CC)";
        String valueStr = row.get(42).toString();
        Double value = Double.parseDouble(valueStr.trim().replace(",",""));
        boolean isDebit = !"Cr".equals(row.get(50).toString());
        Transaction t;
        if(isDebit) {
            t = new Expense("-", date, description, value, Expense.ExpenseMode.CREDIT_CARD);
        } else{
            t = new Income("-", date, description, value);
            Income.IncomeMode mode  = Income.IncomeMode.OTHERS;
            if(!description.contains("NETBANKING TRANSFER")) {
                t.setNotes("From HDFC Credit card");
            }
            ((Income)t).setSource(Income.IncomeMode.OTHERS.toString());
        }
        return t;
    }

    @Override
    protected String getDateFormat() {
        return DATE_ONLY_FORMAT;
    }
}
