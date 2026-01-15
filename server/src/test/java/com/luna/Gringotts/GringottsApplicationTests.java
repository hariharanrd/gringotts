package com.luna.Gringotts;

import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.repository.ExpenseRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

@SpringBootTest
class GringottsApplicationTests {

	@Autowired
	ExpenseRepository expenseRepository;


	@Test
	void contextLoads() {
	}

	@Test
	void addExpense(){
		Expense e = new Expense();
		e.setId(10L);
		e.setTransactionTime(LocalDateTime.now());
		e.setDescription("Test Data");
		e.setValue(1000L);
		expenseRepository.save(e);
	}

	@Test
	void getExpense(){
		expenseRepository.findByDescription("Test Data").forEach(System.out::println);
	}

	@Test
	void updateExpense(){
		Expense e = expenseRepository.findByDescription("Test Data").getFirst();
		e.setValue(2000L);
		expenseRepository.save(e);
	}

	@Test
	void deleteExpense(){
		Expense e = expenseRepository.findByDescription("Test Data").getFirst();
		expenseRepository.delete(e);
	}
}
