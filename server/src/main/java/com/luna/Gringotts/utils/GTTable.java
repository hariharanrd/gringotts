package com.luna.Gringotts.utils;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class GTTable implements Iterable<List<Object>> {

    private final List<List<Object>> table;

    public GTTable(){
        table = new ArrayList<>();
    }
    public GTTable(List<List<Object>> table) {
        this.table = table;
    }

    public Iterator<List<Object>> getRows(){
        return table.iterator();
    }

    public Iterator<List<Object>> getColumns(){
        List<List<Object>> tableAsColumns = new ArrayList<>();
        for (List<Object> originalRow : table) {
            if (tableAsColumns.size() < originalRow.size()) {
                for (int start = tableAsColumns.size(); start < originalRow.size(); start++) {
                    tableAsColumns.add(start, new ArrayList<>());
                }
            }
            for (int columnIndex = 0; columnIndex < originalRow.size(); columnIndex++) {
                tableAsColumns.get(columnIndex).add(originalRow.get(columnIndex));
            }
        }
        return tableAsColumns.iterator();
    }

    public Object getItem(int row, int column){
        return table.get(row).get(column);
    }

    public void setItem(int row, int column, Object value){
        table.get(row).set(column, value);
    }

    public void addRow(List<Object> row){
        table.add(row);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        Iterator<List<Object>> rows = getRows();
        while(rows.hasNext()){
            List<Object> row = rows.next();
            sb.append(row.toString()).append("\n");
        }
        return sb.toString();
    }

    @Override
    public Iterator<List<Object>> iterator() {
        return getRows();
    }
}
