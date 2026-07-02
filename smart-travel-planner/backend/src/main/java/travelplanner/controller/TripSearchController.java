package travelplanner.controller;

import travelplanner.model.TripSearch;
import travelplanner.repository.TripSearchRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/searches")
@CrossOrigin(origins = "http://localhost:3000")
public class TripSearchController {

    private final TripSearchRepository tripSearchRepository;

    public TripSearchController(TripSearchRepository tripSearchRepository) {
        this.tripSearchRepository = tripSearchRepository;
    }

    @GetMapping
    public List<TripSearch> getAllSearches() {
        return tripSearchRepository.findAll();
    }

    @PostMapping
    public TripSearch createSearch(@RequestBody TripSearch tripSearch) {
        return tripSearchRepository.save(tripSearch);
    }
}