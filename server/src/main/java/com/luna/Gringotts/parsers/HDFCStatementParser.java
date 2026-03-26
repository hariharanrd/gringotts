package com.luna.Gringotts.parsers;


import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.Saving;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.utils.FileUtil;
import com.luna.Gringotts.utils.GTTable;

import java.text.ParseException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;

public class HDFCStatementParser  extends StatementParser {


    private static final String DATE_FORMAT = "dd/MM/yy";

    public HDFCStatementParser(String statementFile) {
        super(statementFile);
    }

    @Override
    public void parse() throws Exception {
        try {
            GTTable table = FileUtil.readSheet(this.statementFile);
            Iterator<List<Object>> rowItr = table.getRows();
            boolean start = false;
            while(rowItr.hasNext()){
                List<Object> row = rowItr.next();
                if(!start && isHeaderRow(row)){
                    start = true;
                    continue;
                }
                if(start){
                    String col1 = row.get(0).toString();
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

    private boolean isHeaderRow(List<Object> row){
        String firstCol = row.get(0).toString();
        return "Date".equals(firstCol);
    }

    private Transaction getTransaction(List<Object> row) throws ParseException {
            LocalDateTime date = LocalDate.parse(row.get(0).toString(), DateTimeFormatter.ofPattern(DATE_FORMAT)).atTime(LocalTime.MIDNIGHT);
            String description = row.get(1).toString();
            String refNo = row.get(2).toString();
            boolean isDebit = "-".equals(row.get(5).toString());
            Double value = Double.valueOf(row.get(isDebit?4:5).toString());
            Transaction t;
            if(isDebit) {
                Expense.ExpenseMode mode = Expense.ExpenseMode.OTHERS;
                String generatedDesc;
                if((generatedDesc = getSavingsDesc(description)) != null){
                    t = new Saving(refNo,date,generatedDesc,value);
                    t.setNotes(description);
                }else {
                    generatedDesc = description;
                    if (description.startsWith("UPI")) {
                        mode = Expense.ExpenseMode.UPI;
                        String[] descSplit = description.split("-");
                        generatedDesc = "UPI payment to " + descSplit[1] + "; Info: " + descSplit[descSplit.length - 1];
                    } else if (description.startsWith("ACH D")) {
                        generatedDesc = "Auto Debited to " + description.split("-")[1];
                        mode = Expense.ExpenseMode.EMANDATE;
                    } else if (description.startsWith("POS")) {
                        String[] descSplit = description.split(" ");
                        generatedDesc = "Debit card spending: " + descSplit[descSplit.length - 1];
                        mode = Expense.ExpenseMode.DEBIT_CARD;
                    } else if (description.startsWith("ATW")) {
                        mode = Expense.ExpenseMode.ATM;
                        String[] descSplit = description.split("-");
                        generatedDesc = "Withdrawn from ATM @" + descSplit[descSplit.length - 1];
                    } else if (description.startsWith("IMPS") || description.startsWith("NEFT") || description.startsWith("RTGS") || description.contains("TPT")) {
                        String[] descSplit = description.split("-");
                        generatedDesc = "Fund Transfer to: " + descSplit[descSplit.length - 1];
                        mode = Expense.ExpenseMode.NET_BANKING;
                    }
                    t = new Expense(refNo, date, generatedDesc, value, mode);
                    t.setNotes(description);
                }
            } else{
                String generatedDesc = description;
                Income.IncomeMode mode = Income.IncomeMode.OTHERS;
                if(description.equals("SALARY ZOHO CORPORATION PVT LTD")){
                    mode = Income.IncomeMode.SALARY;
                    generatedDesc = "Salary from Zoho";
                } else if (description.startsWith("UPI")) {
                    generatedDesc = "UPI Payment from " + description.split("-")[1];
                }
                t = new Income(refNo,date,generatedDesc,value);
                t.setNotes(description);
                ((Income)t).setSource(mode.toString());
            }
            return t;
        }

    private String getSavingsDesc(String desc) {
        if(desc.contains("TP ACH INDIANESIGN")){
            return "SIP Payment";
        }
        return null;
    }

    @Override
    protected String getDateFormat() {
        return DATE_FORMAT;
    }
}
