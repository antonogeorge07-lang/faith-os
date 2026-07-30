import time
import random
from sdk import ManifestBuilder, PageBuilder

def fetch_live_jira_metrics():
    """Simulates pulling real-time sprint velocity or issue metrics."""
    # In a production environment, this would query the Jira REST API
    return {
        "completed_tickets": random.randint(35, 60),
        "velocity_trend": [random.randint(40, 90) for _ in range(5)]
    }

def main():
    print("Initializing Real-Time Data Pipeline to FAITH OS SDK...")
    
    # Fetch live operational data
    telemetry = fetch_live_jira_metrics()
    
    # Map live data into the SDK builders
    live_page = (
        PageBuilder("Jira Agile Delivery Deck")
        .set_kpi(f"{telemetry['completed_tickets']} Points")
        .set_chart_values(telemetry['velocity_trend'])
        .add_custom_prop("status_badge", "Live Pipeline Active")
        .add_custom_prop("badge_color", "emerald")
        .build()
    )

    # Wrap in manifest builder
    manifest = (
        ManifestBuilder()
        .add_page("sprint_telemetry", live_page)
    )

    # Export to the runtime directory
    manifest.export("live_manifest.json")
    print("SUCCESS: Live telemetry pipeline compiled 'live_manifest.json'.")

if __name__ == "__main__":
    main()
