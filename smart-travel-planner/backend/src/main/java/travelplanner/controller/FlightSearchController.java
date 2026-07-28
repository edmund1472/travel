package travelplanner.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import travelplanner.model.FlightResult;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FlightSearchController {

    @GetMapping("/search")
    public List<FlightResult> searchFlights() {
        return List.of(
                new FlightResult(
                        "1",
                        "Delta Airlines",
                        "JFK",
                        "LAX",
                        "08:00 AM",
                        "11:30 AM",
                        "5h 30m",
                        0,
                        245.00,
                        4.5
                ),
                new FlightResult(
                        "2",
                        "United Airlines",
                        "EWR",
                        "LAX",
                        "10:15 AM",
                        "2:00 PM",
                        "5h 45m",
                        1,
                        220.00,
                        4.2
                )
        );
    }
}