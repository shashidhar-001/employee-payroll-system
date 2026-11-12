package com.payroll.employee_service.service;

import com.payroll.employee_service.dto.PayrollCalcRequest;
import com.payroll.employee_service.dto.PayrollCalcResponse;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PayrollClient {

  private final RestTemplate restTemplate;

  @Value("${payroll.service.url}")
  private String payrollUrl;

  @Value("${payroll.service.api-key}")
  private String payrollKey;

  public PayrollClient(RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
  }

  public PayrollCalcResponse calculate(PayrollCalcRequest request) {
    try {
      PayrollCalcResponse response = restTemplate.postForObject(
        payrollUrl + "/calculate",
        request,
        PayrollCalcResponse.class
      );
      if (response == null) {
        throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "Empty response from payroll service"
        );
      }
      return response;
    } catch (HttpClientErrorException e) {
      // .NET rejected the data (HTTP 400)
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Payroll service rejected the request: " + e.getResponseBodyAsString()
      );
    } catch (RestClientException e) {
      // .NET is down or unreachable
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Payroll service (.NET) is not reachable. Please try again later."
      );
    }
  }

  public Object summary(int month, int year) {
    try {
      return restTemplate.getForObject(
        payrollUrl + "/payroll/summary?month={m}&year={y}",
        Object.class,
        month,
        year
      );
    } catch (HttpClientErrorException e) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Payroll service rejected the request: " + e.getResponseBodyAsString()
      );
    } catch (RestClientException e) {
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Payroll service (.NET) is not reachable or failed. Please try again later."
      );
    }
  }

  public Object getRules() {
    try {
      return restTemplate.getForObject(payrollUrl + "/rules", Object.class);
    } catch (RestClientException e) {
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Payroll service (.NET) is not reachable. Please try again later."
      );
    }
  }

  public Object updateRules(Map<String, Object> rules, String updatedBy) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("X-Service-Key", payrollKey);
    headers.set("X-Updated-By", updatedBy);
    try {
      return restTemplate
        .exchange(
          payrollUrl + "/rules",
          HttpMethod.PUT,
          new HttpEntity<>(rules, headers),
          Object.class
        )
        .getBody();
    } catch (HttpClientErrorException e) {
      if (e.getStatusCode().value() == 401) {
        throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "The payroll service rejected the service key. Check payroll.service.api-key."
        );
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, rulesError(e));
    } catch (RestClientException e) {
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Payroll service (.NET) is not reachable. Please try again later."
      );
    }
  }

  private String rulesError(HttpClientErrorException e) {
    try {
      Map<?, ?> body = e.getResponseBodyAs(Map.class);
      if (body != null && body.get("error") != null) return body
        .get("error")
        .toString();
    } catch (Exception ignored) {}
    return "The payroll service rejected the rules";
  }
}
