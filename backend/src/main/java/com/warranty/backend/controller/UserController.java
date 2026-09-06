package com.warranty.backend.controller;

import com.warranty.backend.dto.LoginRequest;
import com.warranty.backend.entity.User;
import com.warranty.backend.service.JwtService;
import com.warranty.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    public UserController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {
        return userService.registerUser(user);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {

        boolean success = userService.loginUser(
                request.getEmail(),
                request.getPassword()
        );

        if (!success) {
            return "Invalid email or password";
        }

        return jwtService.generateToken(request.getEmail());
    }
}