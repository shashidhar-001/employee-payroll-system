package com.payroll.employee_service.config;

import com.payroll.employee_service.entity.AppUser;
import com.payroll.employee_service.entity.Role;
import com.payroll.employee_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository userRepo, PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepo.existsByRole(Role.ADMIN)) {
            AppUser admin = new AppUser();
            admin.setEmail("admin@company.com");
            admin.setPassword(encoder.encode("Admin@123"));
            admin.setRole(Role.ADMIN);
            userRepo.save(admin);
            System.out.println("Default admin created: admin@company.com / Admin@123 (change it)");
        }
    }
}