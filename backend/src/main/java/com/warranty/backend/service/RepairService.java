
package com.warranty.backend.service;

import com.warranty.backend.entity.Product;
import com.warranty.backend.entity.Repair;
import com.warranty.backend.entity.User;
import com.warranty.backend.exception.ResourceForbiddenException;
import com.warranty.backend.repository.ProductRepository;
import com.warranty.backend.repository.RepairRepository;
import com.warranty.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RepairService {

    private final RepairRepository repairRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public RepairService(
            RepairRepository repairRepository,
            ProductRepository productRepository,
            UserRepository userRepository) {
        this.repairRepository = repairRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public Repair addRepair(Long productId, Repair repair, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Ensure the product belongs to the authenticated user
        if (!product.getUser().getId().equals(user.getId())) {
            throw new ResourceForbiddenException(
                    "You do not own this product");
        }

        repair.setProduct(product);

        return repairRepository.save(repair);
    }

    public List<Repair> getRepairsByProduct(Long productId, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Ensure the product belongs to the authenticated user
        if (!product.getUser().getId().equals(user.getId())) {
            throw new ResourceForbiddenException(
                    "You do not own this product");
        }

        return repairRepository.findByProductId(productId);
    }
}
