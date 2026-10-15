package travelplanner.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import travelplanner.model.FlightSearch;
import travelplanner.repository.FlightSearchRepository;

import java.util.List;

@RestController
@RequestMapping("/api/flight-searches")
public class SavedFlightSearchController {

    private final FlightSearchRepository flightSearchRepository;

    public SavedFlightSearchController(FlightSearchRepository flightSearchRepository) {
        this.flightSearchRepository = flightSearchRepository;
    }

    @GetMapping
    public List<FlightSearch> getAllSearches() {
        return flightSearchRepository.findAll();
    }

    @PostMapping
    public FlightSearch createSearch(@RequestBody FlightSearch flightSearch) {
        return flightSearchRepository.save(flightSearch);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSearch(@PathVariable Long id) {
        if (!flightSearchRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        flightSearchRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
