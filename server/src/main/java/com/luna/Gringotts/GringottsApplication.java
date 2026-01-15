package com.luna.Gringotts;

import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.repository.ExpenseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
public class GringottsApplication {

	public static void main(String[] args) {
		SpringApplication.run(GringottsApplication.class, args);
	}
}
