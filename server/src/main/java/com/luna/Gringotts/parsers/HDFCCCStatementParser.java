package com.luna.Gringotts.parsers;

import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.utils.FileUtil;
import com.luna.Gringotts.utils.GTTable;
import org.apache.commons.lang3.math.NumberUtils;

import java.text.ParseException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;

public class HDFCCCStatementParser extends StatementParser {

    private static final String[] DATE_FORMATS = new String[] { "dd/MM/yyyy HH:mm:ss", "dd/MM/yyyy / HH:mm",
            "dd/MM/yyyy" };

    String identifiedDateFormat = null;

    public HDFCCCStatementParser(String statementFile) {
        super(statementFile);
    }

    @Override
    protected void parse() throws Exception {
        try {
            GTTable table = FileUtil.readSheet(this.statementFile);
            Iterator<List<Object>> rowItr = table.getRows();
            boolean start = false;
            while (rowItr.hasNext()) {
                List<Object> row = rowItr.next();
                if (!start && row.stream().anyMatch("Transaction type"::equals)) {
                    start = true;
                    continue;
                }
                if (start) {
                    try {
                        for (int col = 0; col < row.size(); col++) {
                            if (isValidDate(row.get(col).toString())) {
                                transactions.add(getTransaction(col, row));
                            }
                        }
                    } catch (ParseException e) {
                        LOGGER.log(Level.SEVERE, "Exception: ", e);
                        LOGGER.log(Level.WARNING, "Ignoring the transaction..");
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Exception: ", e);
            throw e;
        }
    }

    private Transaction getTransaction(int datCol, List<Object> row) throws ParseException {
        LocalDateTime date = null;
        for (String format : DATE_FORMATS) {
            try {
                date = LocalDateTime.parse(row.get(datCol).toString().trim(), DateTimeFormatter.ofPattern(format));
                identifiedDateFormat = format;
                break;
            } catch (DateTimeParseException ignored) {
            }
        }
        int nextCol = datCol + 1;
        String description = "", valueStr = "-1";
        for (; nextCol < row.size(); nextCol++) {
            String temp = row.get(nextCol).toString();
            if (!"-".equals(temp) && !temp.isEmpty()) {
                description = row.get(nextCol).toString() + "-(HDFC Millenia CC)";
                break;
            }
        }
        for (; nextCol < row.size(); nextCol++) {
            String temp = row.get(nextCol).toString().replace(",", "");
            if (!"-".equals(temp) && !temp.isEmpty() && NumberUtils.isParsable(temp)) {
                valueStr = row.get(nextCol).toString();
                break;
            }
        }
        Double value = Double.parseDouble(valueStr.trim().replace(",", ""));
        boolean isDebit = true;
        for (; nextCol < row.size(); nextCol++) {
            String temp = row.get(nextCol).toString();
            if ("Cr".equals(temp)) {
                isDebit = false;
                break;
            }
        }
        Transaction t;
        if (isDebit) {
            t = new Expense("-", date, description, value, Expense.ExpenseMode.CREDIT_CARD);
        } else {
            t = new Income("-", date, description, value);
            if (!description.contains("CREDIT CARD PAYMENT Net Banking")) {
                t.setNotes("From HDFC Credit card");
            }
            ((Income) t).setSource(Income.IncomeMode.OTHERS.toString());
        }
        return t;
    }

    @Override
    protected String getDateFormat(String date) {
        if (identifiedDateFormat == null) {
            for (String format : DATE_FORMATS) {
                try {
                    LocalDateTime.parse(date.trim(), DateTimeFormatter.ofPattern(format));
                    identifiedDateFormat = format;
                    break;
                } catch (DateTimeParseException ignored) {
                }
            }
        }
        return identifiedDateFormat;
    }
}
