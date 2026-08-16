package travelplanner.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import travelplanner.model.FlightResult;

import java.util.ArrayList;
import java.util.List;

@Service
public class FlightService {

    private final RestClient restClient;
    private final String apiKey;
    private final ObjectMapper objectMapper;

    public FlightService(
            RestClient.Builder restClientBuilder,
            @Value("${serpapi.api-key}") String apiKey,
            ObjectMapper objectMapper
    ) {
        this.restClient = restClientBuilder
                .baseUrl("https://serpapi.com")
                .build();

        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
    }

    public List<FlightResult> searchFlights(
            String departure,
            String arrival,
            String date
    ) {

        String response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search.json")
                        .queryParam("engine", "google_flights")
                        .queryParam("departure_id", departure.toUpperCase())
                        .queryParam("arrival_id", arrival.toUpperCase())
                        .queryParam("outbound_date", date)
                        .queryParam("type", "2")
                        .queryParam("currency", "USD")
                        .queryParam("api_key", apiKey)
                        .build())
                .retrieve()
                .body(String.class);

        List<FlightResult> results = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(response);

            parseFlightGroup(root.get("best_flights"), results);
            parseFlightGroup(root.get("other_flights"), results);

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse flight results", e);
        }

        return results;
    }

    private void parseFlightGroup(
            JsonNode flightGroup,
            List<FlightResult> results
    ) {

        if (flightGroup == null || !flightGroup.isArray()) {
            return;
        }

        for (JsonNode itinerary : flightGroup) {

            JsonNode flights = itinerary.get("flights");

            if (flights == null || !flights.isArray() || flights.isEmpty()) {
                continue;
            }

            JsonNode firstFlight = flights.get(0);
            JsonNode lastFlight = flights.get(flights.size() - 1);

            String id = firstFlight
                    .path("flight_number")
                    .asText();

            String airline = firstFlight
                    .path("airline")
                    .asText();

            String airlineLogo = firstFlight
                    .path("airline_logo")
                    .asText();

            String departure = firstFlight
                    .path("departure_airport")
                    .path("id")
                    .asText();

            String arrival = lastFlight
                    .path("arrival_airport")
                    .path("id")
                    .asText();

            String departureTime = firstFlight
                    .path("departure_airport")
                    .path("time")
                    .asText();

            String arrivalTime = lastFlight
                    .path("arrival_airport")
                    .path("time")
                    .asText();

            int totalDuration = itinerary
                    .path("total_duration")
                    .asInt();

            String duration = formatDuration(totalDuration);

            int stops = flights.size() - 1;

            double price = itinerary
                    .path("price")
                    .asDouble();

            FlightResult result = new FlightResult(
                    id,
                    airline,
                    airlineLogo,
                    departure,
                    arrival,
                    departureTime,
                    arrivalTime,
                    duration,
                    stops,
                    price
            );

            results.add(result);
        }
    }

    private String formatDuration(int minutes) {

        int hours = minutes / 60;
        int remainingMinutes = minutes % 60;

        return hours + "h " + remainingMinutes + "m";
    }
}