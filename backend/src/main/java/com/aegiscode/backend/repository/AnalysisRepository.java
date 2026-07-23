package com.aegiscode.backend.repository;

import com.aegiscode.backend.entity.Analysis;
import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {

    List<Analysis> findByProjectOrderByCreatedAtDesc(Project project);

    @Query("SELECT COUNT(a) FROM Analysis a WHERE a.project.user = :user")
    long countByUser(@Param("user") User user);

    @Query("SELECT COUNT(DISTINCT a.fileName) FROM Analysis a WHERE a.project.user = :user")
    long countDistinctFileNamesByUser(@Param("user") User user);

    @Query("SELECT DISTINCT a.language FROM Analysis a WHERE a.project.user = :user")
    List<String> findDistinctLanguagesByUser(@Param("user") User user);

    @Query("SELECT a FROM Analysis a WHERE a.project.user = :user ORDER BY a.createdAt DESC")
    List<Analysis> findRecentActivityByUser(@Param("user") User user, Pageable pageable);

    List<Analysis> findByUserOrderByCreatedAtDesc(User user);
}
