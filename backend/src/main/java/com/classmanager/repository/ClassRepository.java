package com.classmanager.repository;

import com.classmanager.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Integer> {
    java.util.Optional<ClassEntity> findByTeacherId(Integer teacherProfileId);
}
