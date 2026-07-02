package travelplanner.repository;

import travelplanner.model.TripSearch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripSearchRepository extends JpaRepository<TripSearch, Long> {
}