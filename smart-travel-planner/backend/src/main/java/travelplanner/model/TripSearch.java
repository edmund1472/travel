package travelplanner.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class TripSearch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String originCity;
    private LocalDate availableStartDate;
    private LocalDate availableEndDate;
    private Integer tripLengthDays;
    private Integer budget;
    private String destinationPreferences;
    private Boolean allowLayovers;
    private Integer maxLayovers;
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getOriginCity() { return originCity; }
    public LocalDate getAvailableStartDate() { return availableStartDate; }
    public LocalDate getAvailableEndDate() { return availableEndDate; }
    public Integer getTripLengthDays() { return tripLengthDays; }
    public Integer getBudget() { return budget; }
    public String getDestinationPreferences() { return destinationPreferences; }
    public Boolean getAllowLayovers() { return allowLayovers; }
    public Integer getMaxLayovers() { return maxLayovers; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setOriginCity(String originCity) { this.originCity = originCity; }
    public void setAvailableStartDate(LocalDate availableStartDate) { this.availableStartDate = availableStartDate; }
    public void setAvailableEndDate(LocalDate availableEndDate) { this.availableEndDate = availableEndDate; }
    public void setTripLengthDays(Integer tripLengthDays) { this.tripLengthDays = tripLengthDays; }
    public void setBudget(Integer budget) { this.budget = budget; }
    public void setDestinationPreferences(String destinationPreferences) { this.destinationPreferences = destinationPreferences; }
    public void setAllowLayovers(Boolean allowLayovers) { this.allowLayovers = allowLayovers; }
    public void setMaxLayovers(Integer maxLayovers) { this.maxLayovers = maxLayovers; }
}