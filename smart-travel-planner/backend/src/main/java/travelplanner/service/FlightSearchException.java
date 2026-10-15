package travelplanner.service;

import org.springframework.http.HttpStatus;

/**
 * A flight search failure with a message that is safe to show to the user.
 */
public class FlightSearchException extends RuntimeException {

    private final HttpStatus status;

    public FlightSearchException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public FlightSearchException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
