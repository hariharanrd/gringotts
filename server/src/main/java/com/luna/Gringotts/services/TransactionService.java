package com.luna.Gringotts.services;

import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.Saving;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.repository.ExpenseRepository;
import com.luna.Gringotts.repository.IncomeRepository;
import com.luna.Gringotts.repository.SavingRepository;
import com.luna.Gringotts.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionService {

    @Autowired
    ExpenseRepository expenseRepository;

    @Autowired
    IncomeRepository incomeRepository;

    @Autowired
    SavingRepository savingRepository;

    @Autowired
    TransactionRepository<Transaction> transactionRepository;

    public Expense getExpenseById(Long id){
        return expenseRepository.findById(id).orElse(null);
    }

    public Income getIncomeById(Long id){
        return incomeRepository.findById(id).orElse(null);
    }

    public Saving getSavingById(Long id){
        return savingRepository.findById(id).orElse(null);
    }

    public void saveExpense(Expense e){
        expenseRepository.save(e);
    }

    public void saveIncome(Income i){
        incomeRepository.save(i);
    }

    public void saveSaving(Saving s){
        savingRepository.save(s);
    }

    public Page<Expense> getExpenses(Pageable pageable){
        return expenseRepository.findAll(pageable);
    }

    public Page<Income> getIncomes(Pageable pageable){
        return incomeRepository.findAll(pageable);
    }

    public Page<Saving> getSavings(Pageable pageable){
        return savingRepository.findAll(pageable);
    }

    public void deleteTransaction(Long id){
        transactionRepository.deleteById(id);
    }

    public void updateExpense(Expense e){
        expenseRepository.save(e);
    }

    public void updateIncome(Income i){
        incomeRepository.save(i);
    }


    public void updateSaving(Saving s){
        savingRepository.save(s);
    }

    public List<Expense> getExpense(Example<Expense> example){
        return expenseRepository.findAll(example);
    }

    public List<Income> getIncome(Example<Income> example){
        return incomeRepository.findAll(example);
    }

    public List<Saving> getSaving(Example<Saving> example){
        return savingRepository.findAll(example);
    }

}
