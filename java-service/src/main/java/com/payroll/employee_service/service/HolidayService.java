package com.payroll.employee_service.service;

import com.payroll.employee_service.entity.Holiday;
import com.payroll.employee_service.repository.HolidayRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class HolidayService {

    private final HolidayRepository repo;

    public HolidayService(HolidayRepository repo) {
        this.repo = repo;
    }

    /** Declared holidays in a date range (Sundays are not stored, they are always off). */
    public Set<LocalDate> declaredBetween(LocalDate from, LocalDate to) {
        return repo.findByDateBetweenOrderByDateAsc(from, to).stream()
                .map(Holiday::getDate).collect(Collectors.toSet());
    }

    /** A day off is a Sunday or a declared holiday. */
    public static boolean isOff(LocalDate d, Set<LocalDate> declared) {
        return d.getDayOfWeek() == DayOfWeek.SUNDAY || declared.contains(d);
    }

    public int countWorkingDays(LocalDate from, LocalDate to) {
        Set<LocalDate> declared = declaredBetween(from, to);
        int count = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (!isOff(d, declared)) count++;
        }
        return count;
    }

    /** Name of the holiday on this date, or null if it is a working day. */
    public String describe(LocalDate d) {
        if (d.getDayOfWeek() == DayOfWeek.SUNDAY) return "Sunday";
        return repo.findByDate(d).map(Holiday::getName).orElse(null);
    }
}