package com.aegiscode.backend.repository;

import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByUser(User user);

}