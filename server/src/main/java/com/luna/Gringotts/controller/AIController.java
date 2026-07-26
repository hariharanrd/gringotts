package com.luna.Gringotts.controller;

import com.luna.Gringotts.dto.GeminiDTOs;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.services.AIRateLimiterService;
import com.luna.Gringotts.services.GeminiService;
import com.luna.Gringotts.services.IAMService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/api/v1/ai")
public class AIController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private IAMService iamService;

    @Autowired
    private AIRateLimiterService aiRateLimiterService;

    @PostMapping("/chat")
    public ResponseEntity<GeminiDTOs.AIChatResponse> parseTransactionWithGoblin(@RequestBody GeminiDTOs.AIChatRequest request) {
        User currentUser = iamService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!aiRateLimiterService.isAllowed(currentUser.getId())) {
            String limitMsg = "*grumbles loudly* You have reached Goblin's vault rate limit! Please wait a moment before asking again.";
            Map<String, Object> errPayload = new HashMap<>();
            errPayload.put("action_type", "CONVERSATIONAL");
            errPayload.put("goblin_response", limitMsg);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new GeminiDTOs.AIChatResponse(limitMsg, errPayload));
        }

        GeminiDTOs.AIChatResponse response = geminiService.parseTransactionWithGoblin(request, currentUser);
        return ResponseEntity.ok(response);
    }
}
