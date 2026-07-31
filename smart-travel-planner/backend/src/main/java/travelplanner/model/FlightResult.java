package travelplanner.model;

public record FlightResult(
        String id,
        String airline,
        String departure,
        String arrival,
        String departureTime,
        String arrivalTime,
        String duration,
        String test,
        int stops,
        double price,
        double rating
) {
}