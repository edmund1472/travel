package travelplanner.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import travelplanner.model.FlightResult;
import travelplanner.service.FlightService;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FlightSearchController {

    private final FlightService flightService;

    public FlightSearchController(FlightService flightService) {
        this.flightService = flightService;
    }

    @GetMapping(
            value = "/search",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public List<FlightResult> searchFlights(
            @RequestParam String departure,
            @RequestParam String arrival,
            @RequestParam String date
    ) {
        return flightService.searchFlights(
                departure,
                arrival,
                date
        );
    }
}