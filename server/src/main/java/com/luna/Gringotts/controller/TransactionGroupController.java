package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.records.TransactionGroup;
import com.luna.Gringotts.services.TransactionGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class TransactionGroupController {

    @Autowired
    private TransactionGroupService transactionGroupService;

    @GetMapping("/transaction-groups")
    public ResponseEntity<Map<String, Object>> getAllGroups() {
        List<TransactionGroup> groups = transactionGroupService.getAllGroups();
        Map<String, Object> response = new HashMap<>();
        response.put("data", groups);
        response.put("total_count", groups.size());
        response.put("has_more", false);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transaction-groups/{id}")
    public ResponseEntity<Map<String, Object>> getGroupById(@PathVariable Long id) {
        TransactionGroup group = transactionGroupService.getGroupById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));
        return ResponseEntity.ok(Map.of("data", group, "status", "success"));
    }

    @PostMapping("/transaction-groups")
    public ResponseEntity<Map<String, Object>> createGroup(@RequestBody TransactionGroup group) {
        TransactionGroup created = transactionGroupService.createGroup(group);
        return ResponseEntity.ok(Map.of("data", created, "status", "success"));
    }

    @PutMapping("/transaction-groups/{id}")
    public ResponseEntity<Map<String, Object>> updateGroup(@PathVariable Long id, @RequestBody TransactionGroup group) {
        TransactionGroup updated = transactionGroupService.updateGroup(id, group);
        return ResponseEntity.ok(Map.of("data", updated, "status", "success"));
    }

    @DeleteMapping("/transaction-groups/{id}")
    public ResponseEntity<Map<String, Object>> deleteGroup(@PathVariable Long id) {
        transactionGroupService.deleteGroup(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Group deleted successfully"));
    }

    @GetMapping("/transaction-groups/{id}/transactions")
    public ResponseEntity<Map<String, Object>> getGroupTransactions(
            @PathVariable Long id,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        
        Map<String, Object> response = new HashMap<>();
        if (page != null && size != null) {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page - 1, size);
            org.springframework.data.domain.Page<Transaction> result = transactionGroupService.getGroupTransactionsPaginated(id, pageable);
            response.put("data", result.getContent());
            response.put("total_count", result.getTotalElements());
            response.put("has_more", result.hasNext());
            response.put("page", pageable.getPageNumber() + 1);
        } else {
            List<Transaction> transactions = transactionGroupService.getGroupTransactions(id);
            response.put("data", transactions);
            response.put("total_count", transactions.size());
            response.put("has_more", false);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transaction-groups/{id}/statistics")
    public ResponseEntity<Map<String, Object>> getGroupStatistics(@PathVariable Long id) {
        Map<String, Object> stats = transactionGroupService.getGroupStatistics(id);
        return ResponseEntity.ok(Map.of("data", stats, "status", "success"));
    }

    @GetMapping("/transaction-groups/{id}/thumbnail")
    public ResponseEntity<Map<String, Object>> getGroupThumbnail(@PathVariable Long id) {
        String thumbnail = transactionGroupService.getGroupThumbnail(id);
        return ResponseEntity.ok(Map.of("data", thumbnail != null ? thumbnail : "", "status", "success"));
    }

    @GetMapping("/transaction-groups/{id}/members")
    public ResponseEntity<Map<String, Object>> getGroupMembers(@PathVariable Long id) {
        List<com.luna.Gringotts.records.GroupMember> members = transactionGroupService.getGroupMembers(id);
        Map<String, Object> response = new HashMap<>();
        response.put("data", members);
        response.put("total_count", members.size());
        response.put("has_more", false);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transaction-groups/{id}/invite")
    public ResponseEntity<Map<String, Object>> inviteMember(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String identifier = request.get("identifier");
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new IllegalArgumentException("Username or email is required");
        }
        transactionGroupService.inviteMember(id, identifier.trim());
        return ResponseEntity.ok(Map.of("status", "success", "message", "Invitation sent successfully"));
    }

    @GetMapping("/transaction-groups/invitations")
    public ResponseEntity<Map<String, Object>> getPendingInvitations() {
        List<com.luna.Gringotts.records.GroupMember> invitations = transactionGroupService.getPendingInvitations();
        Map<String, Object> response = new HashMap<>();
        response.put("data", invitations);
        response.put("total_count", invitations.size());
        response.put("has_more", false);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transaction-groups/invitations/{memberId}/accept")
    public ResponseEntity<Map<String, Object>> acceptInvitation(@PathVariable Long memberId) {
        transactionGroupService.acceptInvitation(memberId);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Invitation accepted successfully"));
    }

    @PostMapping("/transaction-groups/invitations/{memberId}/decline")
    public ResponseEntity<Map<String, Object>> declineInvitation(@PathVariable Long memberId) {
        transactionGroupService.declineInvitation(memberId);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Invitation declined successfully"));
    }

    @DeleteMapping("/transaction-groups/{id}/members/{userId}")
    public ResponseEntity<Map<String, Object>> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        transactionGroupService.removeMember(id, userId);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Member removed successfully"));
    }

    @DeleteMapping("/transaction-groups/{id}/leave")
    public ResponseEntity<Map<String, Object>> leaveGroup(@PathVariable Long id) {
        transactionGroupService.leaveGroup(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Left group successfully"));
    }
}
