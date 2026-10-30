
package com.warranty.backend.repository;

import com.warranty.backend.entity.Repair;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RepairRepository extends JpaRepository<Repair, Long> {

    List<Repair> findByProductId(Long productId);
}
