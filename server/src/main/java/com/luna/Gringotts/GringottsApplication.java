package com.luna.Gringotts;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class GringottsApplication {

	public static void main(String[] args) {
		SpringApplication.run(GringottsApplication.class, args);
	}

}
