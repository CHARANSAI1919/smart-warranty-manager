package com.warranty.backend.repository;

import com.warranty.backend.entity.Repair;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairRepository extends JpaRepository<Repair, Long> {
}