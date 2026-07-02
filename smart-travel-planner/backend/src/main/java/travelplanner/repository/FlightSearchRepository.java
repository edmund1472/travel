package travelplanner.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import travelplanner.model.FlightSearch;

public interface FlightSearchRepository extends JpaRepository<FlightSearch, Long> {
    List<FlightSearch> findTop6ByOrderByCreatedAtDesc();
}
