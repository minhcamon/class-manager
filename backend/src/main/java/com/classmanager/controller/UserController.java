package com.classmanager.controller;

import com.classmanager.dto.request.RejectRequest;
import com.classmanager.dto.response.UserResponse;
import com.classmanager.entity.User;
import com.classmanager.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/pending")
    public ResponseEntity<List<UserResponse>> getPendingUsers(@AuthenticationPrincipal User currentUser) {
        List<UserResponse> pending = userService.getPendingUsers(currentUser);
        return ResponseEntity.ok(pending);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<UserResponse> approveUser(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser) {
        UserResponse response = userService.approveUser(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<UserResponse> rejectUser(
            @PathVariable Integer id,
            @Valid @RequestBody RejectRequest rejectRequest,
            @AuthenticationPrincipal User currentUser) {
        UserResponse response = userService.rejectUser(id, rejectRequest.getReason(), currentUser);
        return ResponseEntity.ok(response);
    }
}
