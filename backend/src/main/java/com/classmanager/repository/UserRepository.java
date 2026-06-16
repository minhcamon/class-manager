package com.classmanager.repository;

import com.classmanager.entity.User;
import com.classmanager.entity.UserApprovalStatus;
import com.classmanager.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByGoogleEmail(String googleEmail);

    Optional<User> findByPhoneNumber(String phoneNumber);

    List<User> findByApprovalStatusAndRole(UserApprovalStatus approvalStatus, UserRole role);

    @Query("SELECT u FROM User u JOIN StudentProfile sp ON sp.user.id = u.id WHERE u.approvalStatus = :status AND sp.classEntity.id = :classId")
    List<User> findPendingStudentsByClassId(@Param("status") UserApprovalStatus status, @Param("classId") Integer classId);
}
