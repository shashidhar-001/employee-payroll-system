package com.payroll.employee_service.security;

import com.payroll.employee_service.entity.AppUser;
import com.payroll.employee_service.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepo;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims c = jwtService.parse(header.substring(7));

                // The token only proves who the user is. Whether they may still use the system
                // is checked against the database on every request, so deactivation is immediate.
                AppUser account = userRepo.findByEmail(c.getSubject()).orElse(null);
                boolean allowed = account != null && account.isActive()
                        && (account.getEmployee() == null || account.getEmployee().isActive());

                if (allowed) {
                    Long employeeId = account.getEmployee() == null ? null : account.getEmployee().getId();
                    // Role and employee link come from the database, not from the token
                    AuthUser user = new AuthUser(account.getEmail(), account.getRole().name(), employeeId);
                    var auth = new UsernamePasswordAuthenticationToken(user, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + user.role())));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    SecurityContextHolder.clearContext();
                }
            } catch (Exception e) {
                // invalid or expired token: leave unauthenticated, the request gets a 401
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}