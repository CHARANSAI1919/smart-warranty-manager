package com.warranty.backend.controller;

import com.warranty.backend.entity.Product;
import com.warranty.backend.service.ProductService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> getAllProducts(Authentication authentication) {

        String email = authentication.getName();

        return productService.getAllProducts(email);
    }

    @PostMapping
    public Product createProduct(
            @RequestBody Product product,
            Authentication authentication) {

        String email = authentication.getName();

        return productService.createProduct(product, email);
    }

    @PutMapping("/{id}")
public Product updateProduct(
        @PathVariable Long id,
        @RequestBody Product product,
        Authentication authentication) {

    String email = authentication.getName();

    return productService.updateProduct(id, product, email);
}

    @DeleteMapping("/{id}")
public String deleteProduct(
        @PathVariable Long id,
        Authentication authentication) {

    String email = authentication.getName();

    productService.deleteProduct(id, email);

    return "Product deleted successfully";
}
}