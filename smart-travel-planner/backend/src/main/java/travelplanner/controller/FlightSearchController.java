package travelplanner.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import travelplanner.model.FlightSearch;
import travelplanner.repository.FlightSearchRepository;

@RestController
@RequestMapping("/api/flight-searches")
@CrossOrigin(origins = {"http://localhost:3000"})
public class FlightSearchController {

    private final FlightSearchRepository repository;

    public FlightSearchController(FlightSearchRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<FlightSearch> getRecentSearches() {
        return repository.findTop6ByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<FlightSearch> createSearch(@RequestBody FlightSearchRequest request) {
        FlightSearch search = new FlightSearch();
        search.setHomeAirport(request.homeAirport());
        search.setDestinations(request.destinations());
        search.setDepartDate(request.departDate());
        search.setReturnDate(request.returnDate());
        search.setTripDuration(request.tripDuration());
        search.setCustomDays(request.customDays());
        search.setAllowLayovers(request.allowLayovers());

        FlightSearch saved = repository.save(search);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSearch(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public record FlightSearchRequest(
        String homeAirport,
        String destinations,
        String departDate,
        String returnDate,
        String tripDuration,
        String customDays,
        boolean allowLayovers
    ) {}
}
