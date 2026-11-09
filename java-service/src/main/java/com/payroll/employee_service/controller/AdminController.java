package com.payroll.employee_service.controller;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final RestTemplate shortTimeout;

  @Value("${payroll.service.url}")
  private String payrollUrl;

  public AdminController() {
    SimpleClientHttpRequestFactory factory =
      new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(2000);
    factory.setReadTimeout(2000);
    this.shortTimeout = new RestTemplate(factory);
  }

  @GetMapping("/system-status")
  public Map<String, Object> systemStatus() {
    Map<String, Object> dotnet = new LinkedHashMap<>();
    long start = System.currentTimeMillis();
    try {
      shortTimeout.getForObject(payrollUrl + "/health", Map.class);
      dotnet.put("status", "UP");
      dotnet.put("responseMs", System.currentTimeMillis() - start);
    } catch (Exception e) {
      dotnet.put("status", "DOWN");
    }

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("java", Map.of("status", "UP")); // if this code runs, Java is up
    result.put("dotnet", dotnet);
    result.put("checkedAt", LocalDateTime.now().toString());
    return result;
  }
}
