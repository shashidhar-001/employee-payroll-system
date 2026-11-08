package com.payroll.employee_service.controller;

import com.payroll.employee_service.dto.EmployeeRequest;
import com.payroll.employee_service.entity.Department;
import com.payroll.employee_service.entity.Employee;
import com.payroll.employee_service.repository.DepartmentRepository;
import com.payroll.employee_service.repository.EmployeeRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeRepository employeeRepo;
    private final DepartmentRepository departmentRepo;

    public EmployeeController(EmployeeRepository employeeRepo, DepartmentRepository departmentRepo) {
        this.employeeRepo = employeeRepo;
        this.departmentRepo = departmentRepo;
    }

    @GetMapping
    public List<Employee> getAll(@RequestParam(required = false) Long departmentId) {
        if (departmentId != null) {
            return employeeRepo.findByDepartmentId(departmentId);
        }
        return employeeRepo.findAll();
    }

    @GetMapping("/{id}")
    public Employee getOne(@PathVariable Long id) {
        return employeeRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Employee create(@Valid @RequestBody EmployeeRequest req) {
        Employee e = new Employee();
        apply(e, req);
        return employeeRepo.save(e);
    }

    @PutMapping("/{id}")
    public Employee update(@PathVariable Long id, @Valid @RequestBody EmployeeRequest req) {
        Employee e = getOne(id);
        apply(e, req);
        return employeeRepo.save(e);
    }

    // Deactivate instead of deleting, so payslip history stays intact
    @DeleteMapping("/{id}")
    public Employee deactivate(@PathVariable Long id) {
        Employee e = getOne(id);
        e.setActive(false);
        return employeeRepo.save(e);
    }

    private void apply(Employee e, EmployeeRequest req) {
        Department d = departmentRepo.findById(req.getDepartmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
        e.setName(req.getName());
        e.setEmail(req.getEmail());
        e.setPhone(req.getPhone());
        e.setDesignation(req.getDesignation());
        e.setJoiningDate(req.getJoiningDate());
        e.setBasicSalary(req.getBasicSalary());
        e.setDepartment(d);
    }
}