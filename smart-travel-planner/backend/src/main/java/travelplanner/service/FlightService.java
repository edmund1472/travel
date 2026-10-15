package travelplanner.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import travelplanner.model.FlightResult;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class FlightService {

    private static final Logger log = LoggerFactory.getLogger(FlightService.class);

    private static final Pattern AIRPORT_CODE = Pattern.compile("[A-Za-z]{3}");

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

        validate(departure, arrival, date);

        if (apiKey == null || apiKey.isBlank()) {
            throw new FlightSearchException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Flight search isn't configured: SERPAPI_API_KEY is missing on the server.");
        }

        String response;
        try {
            response = restClient.get()
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
        } catch (RestClientResponseException e) {
            throw fromSerpApiError(e.getStatusCode().value(), serpApiErrorMessage(e.getResponseBodyAsString()), e);
        } catch (ResourceAccessException e) {
            throw new FlightSearchException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Couldn't reach the flight data provider. Check your internet connection and try again.", e);
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(response);
        } catch (Exception e) {
            throw new FlightSearchException(HttpStatus.BAD_GATEWAY,
                    "The flight data provider sent a response we couldn't read.", e);
        }

        if (root.has("error")) {
            String error = root.get("error").asText();
            // SerpAPI reports an empty search as an "error"; that's just zero results.
            if (error.toLowerCase().contains("hasn't returned any results")) {
                return List.of();
            }
            throw fromSerpApiError(200, error, null);
        }

        List<FlightResult> results = new ArrayList<>();
        parseFlightGroup(root.get("best_flights"), results);
        parseFlightGroup(root.get("other_flights"), results);
        return results;
    }

    private static void validate(String departure, String arrival, String date) {
        if (!AIRPORT_CODE.matcher(departure.trim()).matches()) {
            throw new FlightSearchException(HttpStatus.BAD_REQUEST,
                    "\"" + departure + "\" isn't a valid 3-letter airport code.");
        }
        if (!AIRPORT_CODE.matcher(arrival.trim()).matches()) {
            throw new FlightSearchException(HttpStatus.BAD_REQUEST,
                    "\"" + arrival + "\" isn't a valid 3-letter airport code.");
        }
        if (departure.trim().equalsIgnoreCase(arrival.trim())) {
            throw new FlightSearchException(HttpStatus.BAD_REQUEST,
                    "Origin and destination can't be the same airport.");
        }

        LocalDate parsed;
        try {
            parsed = LocalDate.parse(date);
        } catch (DateTimeParseException e) {
            throw new FlightSearchException(HttpStatus.BAD_REQUEST,
                    "\"" + date + "\" isn't a valid date. Use YYYY-MM-DD.");
        }
        if (parsed.isBefore(LocalDate.now())) {
            throw new FlightSearchException(HttpStatus.BAD_REQUEST,
                    "The departure date " + date + " is in the past.");
        }
    }

    private String serpApiErrorMessage(String body) {
        try {
            JsonNode node = objectMapper.readTree(body);
            if (node.has("error")) {
                return node.get("error").asText();
            }
        } catch (Exception ignored) {
            // Not JSON; fall through to the raw body.
        }
        return body;
    }

    private static FlightSearchException fromSerpApiError(int status, String error, Throwable cause) {
        log.warn("SerpAPI error (HTTP {}): {}", status, error);
        String lower = error == null ? "" : error.toLowerCase();

        if (status == 401 || lower.contains("invalid api key")) {
            return new FlightSearchException(HttpStatus.BAD_GATEWAY,
                    "The server's SerpAPI key was rejected. Check SERPAPI_API_KEY.", cause);
        }
        if (status == 429 || lower.contains("run out of searches") || lower.contains("rate limit")) {
            return new FlightSearchException(HttpStatus.TOO_MANY_REQUESTS,
                    "The flight search quota has been used up. Try again later.", cause);
        }
        if (status == 400) {
            return new FlightSearchException(HttpStatus.BAD_REQUEST,
                    "Google Flights rejected this search: " + error, cause);
        }
        return new FlightSearchException(HttpStatus.BAD_GATEWAY,
                "The flight data provider returned an error: " + error, cause);
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