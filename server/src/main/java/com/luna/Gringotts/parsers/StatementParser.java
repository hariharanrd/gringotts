package com.luna.Gringotts.parsers;

import com.luna.Gringotts.records.Transaction;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.logging.Logger;

public abstract class StatementParser {

    protected static final Logger LOGGER = Logger.getLogger(StatementParser.class.getName());

    protected String statementFile;
    protected List<Transaction> transactions = new ArrayList<Transaction>();
    protected boolean parsed = false;

    public StatementParser(String statementFile){
        this.statementFile = statementFile;
    }

    public void parseStatement() throws Exception{
        parse();
        parsed = true;
    }

    protected abstract void parse() throws Exception;

    protected boolean isValidDate(String date){
        try {
            new SimpleDateFormat(getDateFormat()).parse(date);
            return true;
        } catch (ParseException pe){
            return false;
        }
    }

    protected abstract String getDateFormat();

    public final List<Transaction> getTransactions() throws Exception {
        if(!parsed){
            throw new Exception("Statement file not parsed yet. call #parseStatement first!!!");
        }
        transactions.forEach(t-> t.setImported(true));
        return Collections.unmodifiableList(transactions);
    }
}
