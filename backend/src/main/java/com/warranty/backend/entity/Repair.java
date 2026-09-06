package com.warranty.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "repairs")
public class Repair {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate repairDate;

    private String description;

    private Double cost;
    @ManyToOne
@JoinColumn(name = "product_id", nullable = false)
private Product product;
    public Repair() {
    }

    // getters and setters
    public Product getProduct() {
    return product;
}

public void setProduct(Product product) {
    this.product = product;
}
}