package com.warranty.backend.service;

import com.warranty.backend.entity.Product;
import com.warranty.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import com.warranty.backend.entity.User;
import com.warranty.backend.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    public ProductService(
        ProductRepository productRepository,
        UserRepository userRepository) {

    this.productRepository = productRepository;
    this.userRepository = userRepository;
}

    public List<Product> getAllProducts(String email) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    return productRepository.findByUserId(user.getId());
}

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

   public Product createProduct(Product product, String email) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    product.setUser(user);

    if (product.getPurchaseDate() != null &&
            product.getWarrantyMonths() != null) {

        LocalDate expiry = product.getPurchaseDate()
                .plusMonths(product.getWarrantyMonths());

        product.setWarrantyExpiry(expiry);
    }

    return productRepository.save(product);
}

   public Product updateProduct(
        Long id,
        Product updatedProduct,
        String email) {

        Product existingProduct = getProductById(id);
        User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found"));

if (!existingProduct.getUser().getId().equals(user.getId())) {
    throw new RuntimeException("You do not own this product");
}
        existingProduct.setName(updatedProduct.getName());
        existingProduct.setBrand(updatedProduct.getBrand());
        existingProduct.setCategory(updatedProduct.getCategory());
        existingProduct.setPrice(updatedProduct.getPrice());
        existingProduct.setPurchaseDate(updatedProduct.getPurchaseDate());
        existingProduct.setWarrantyMonths(updatedProduct.getWarrantyMonths());

        if (updatedProduct.getPurchaseDate() != null &&
                updatedProduct.getWarrantyMonths() != null) {

            LocalDate expiry = updatedProduct.getPurchaseDate()
                    .plusMonths(updatedProduct.getWarrantyMonths());

            existingProduct.setWarrantyExpiry(expiry);
        }

        return productRepository.save(existingProduct);
    }

    public void deleteProduct(Long id, String email) {

    Product existingProduct = getProductById(id);

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (!existingProduct.getUser().getId().equals(user.getId())) {
        throw new RuntimeException("You do not own this product");
    }

    productRepository.deleteById(id);
}
}