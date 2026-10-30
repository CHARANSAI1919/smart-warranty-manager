
package com.warranty.backend.controller;

import com.warranty.backend.entity.Repair;
import com.warranty.backend.service.RepairService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/repairs")
public class RepairController {

    private final RepairService repairService;

    public RepairController(RepairService repairService) {
        this.repairService = repairService;
    }

    @PostMapping
    public Repair addRepair(
            @PathVariable Long productId,
            @RequestBody Repair repair,
            Authentication authentication) {

        String email = authentication.getName();

        return repairService.addRepair(productId, repair, email);
    }

    @GetMapping
    public List<Repair> getRepairs(
            @PathVariable Long productId,
            Authentication authentication) {

        String email = authentication.getName();

        return repairService.getRepairsByProduct(productId, email);
    }
}
