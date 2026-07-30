package travelplanner;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TravelplannerApplication {

    public static void main(String[] args) {

        Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();

        String dbPassword = dotenv.get("DB_PASSWORD");
        if (dbPassword != null) {
            System.setProperty("DB_PASSWORD", dbPassword);
        }

        String serpApiKey = dotenv.get("SERPAPI_API_KEY");
        if (serpApiKey != null) {
            System.setProperty("SERPAPI_API_KEY", serpApiKey);
        }

        SpringApplication.run(TravelplannerApplication.class, args);
    }
}