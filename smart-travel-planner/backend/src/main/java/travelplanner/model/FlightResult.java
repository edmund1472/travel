package travelplanner.model;

public record FlightResult(
        String id,
        String airline,
        String airlineLogo,
        String departure,
        String arrival,
        String departureTime,
        String arrivalTime,
        String duration,
        int stops,
        double price
) {
}