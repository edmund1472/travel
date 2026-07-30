package travelplanner.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/api/flights")
public class FlightSearchController {

    private final RestClient restClient;
    private final String apiKey;

    public FlightSearchController(
            RestClient.Builder restClientBuilder,
            @Value("${serpapi.api-key}") String apiKey
    ) {
        this.restClient = restClientBuilder
                .baseUrl("https://serpapi.com")
                .build();

        this.apiKey = apiKey;
    }

    @GetMapping(
            value = "/search",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public String searchFlights(
            @RequestParam String departure,
            @RequestParam String arrival,
            @RequestParam String date
    ) {
        return restClient.get()
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
    }
}