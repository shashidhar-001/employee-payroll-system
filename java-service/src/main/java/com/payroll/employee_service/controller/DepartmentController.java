package com.payroll.employee_service.controller;

import com.payroll.employee_service.entity.Department;
import com.payroll.employee_service.repository.DepartmentRepository;
import com.payroll.employee_service.repository.EmployeeRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentRepository repo;
    private final EmployeeRepository employeeRepo;

    public DepartmentController(DepartmentRepository repo, EmployeeRepository employeeRepo) {
        this.repo = repo;
        this.employeeRepo = employeeRepo;
    }

    @GetMapping
    public List<Department> getAll() {
        return repo.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Department create(@Valid @RequestBody Department department) {
        String name = department.getName().trim();
        if (repo.findByNameIgnoreCase(name).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A department with this name already exists");
        }
        department.setId(null);
        department.setName(name);
        return repo.save(department);
    }

    @PutMapping("/{id}")
    public Department rename(@PathVariable Long id, @Valid @RequestBody Department body) {
        Department d = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        String name = body.getName().trim();
        repo.findByNameIgnoreCase(name).ifPresent(other -> {
            if (!other.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A department with this name already exists");
            }
        });
        d.setName(name);
        return repo.save(d);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        Department d = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        if (employeeRepo.existsByDepartmentId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This department still has employees. Move them to another department first.");
        }
        repo.delete(d);
        return Map.of("message", "Department deleted");
    }
}