package com.payroll.employee_service.service;

import com.payroll.employee_service.dto.PayrollCalcRequest;
import com.payroll.employee_service.dto.PayrollCalcResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
}
