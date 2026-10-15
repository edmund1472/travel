package travelplanner.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import travelplanner.model.FlightResult;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class FlightService {

    private static final Logger log = LoggerFactory.getLogger(FlightService.class);

    // Google Flights rejects metro/city codes, but accepts a comma-separated list of airports.
    private static final Map<String, String> METRO_AREAS = Map.of(
            "NYC", "JFK,EWR,LGA",
            "LON", "LHR,LGW,STN,LTN,LCY",
            "WAS", "IAD,DCA,BWI",
            "CHI", "ORD,MDW",
            "TYO", "HND,NRT",
            "PAR", "CDG,ORY",
            "SEL", "ICN,GMP",
            "MIL", "MXP,LIN,BGY",
            "OSA", "KIX,ITM",
            "ROM", "FCO,CIA"
    );

    private static String toAirportIds(String code) {
        String upper = code.trim().toUpperCase();
        return METRO_AREAS.getOrDefault(upper, upper);
    }

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
                        .queryParam("departure_id", toAirportIds(departure))
                        .queryParam("arrival_id", toAirportIds(arrival))
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

            if (root.has("error")) {
                log.warn("SerpAPI returned an error for {} -> {} on {}: {}",
                        departure, arrival, date, root.get("error").asText());
            }

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