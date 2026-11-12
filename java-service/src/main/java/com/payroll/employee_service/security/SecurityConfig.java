package com.payroll.employee_service.security;

import com.payroll.employee_service.repository.UserRepository;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain filterChain(
    HttpSecurity http,
    JwtService jwtService,
    UserRepository userRepo
  ) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(Customizer.withDefaults())
      .sessionManagement(s ->
        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .exceptionHandling(e ->
        e.authenticationEntryPoint(
          new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
        )
      )
      .authorizeHttpRequests(auth ->
        auth
          .requestMatchers("/error")
          .permitAll()
          .requestMatchers(HttpMethod.POST, "/api/auth/login")
          .permitAll()
          .requestMatchers("/api/users/**")
          .hasRole("ADMIN")
          .requestMatchers(HttpMethod.POST, "/api/departments/**")
          .hasRole("ADMIN")
          .requestMatchers(HttpMethod.GET, "/api/departments/**")
          .authenticated()
          .requestMatchers("/api/employees/**")
          .hasAnyRole("ADMIN", "HR")
          .requestMatchers("/api/attendance/employee/**")
          .hasAnyRole("ADMIN", "HR")
          .requestMatchers("/api/payslips/generate")
          .hasAnyRole("ADMIN", "HR")
          .requestMatchers("/api/payslips/my/**")
          .authenticated()
          .requestMatchers("/api/payslips", "/api/payslips/one")
          .hasAnyRole("ADMIN", "HR")
          .requestMatchers(
            "/api/leaves/pending",
            "/api/leaves/employee/**",
            "/api/leaves/*/approve",
            "/api/leaves/*/reject"
          )
          .hasAnyRole("ADMIN", "HR")
          .requestMatchers("/api/leaves/**")
          .authenticated()
          .requestMatchers("/internal/**")
          .permitAll() // protected by the service key instead of a JWT
          .requestMatchers("/api/reports/**")
          .hasAnyRole("ADMIN", "HR")
          .requestMatchers("/api/admin/**")
          .hasRole("ADMIN")
          .requestMatchers(HttpMethod.PUT, "/api/departments/**")
          .hasRole("ADMIN")
          .requestMatchers(HttpMethod.DELETE, "/api/departments/**")
          .hasRole("ADMIN")
          .requestMatchers("/api/payroll/rules")
          .hasRole("ADMIN")
          .requestMatchers(HttpMethod.POST, "/api/holidays")
          .hasAnyRole("ADMIN", "HR")
          .requestMatchers(HttpMethod.DELETE, "/api/holidays/**")
          .hasAnyRole("ADMIN", "HR")
          .anyRequest()
          .authenticated()
      )
      .addFilterBefore(
        new JwtAuthFilter(jwtService, userRepo),
        UsernamePasswordAuthenticationFilter.class
      );
    return http.build();
  }

  // Lets the React app (port 3000) call this service
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("http://localhost:3000"));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    UrlBasedCorsConfigurationSource source =
      new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
