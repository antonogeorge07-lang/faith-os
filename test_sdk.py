from sdk import ManifestBuilder, PageBuilder

def main():
    print("Initializing SDK generation sequence...")
    
    # 1. Programmatically construct the page payload
    analytics_page = (
        PageBuilder("Autonomous Operations Center")
        .set_kpi("99.9% Uptime")
        .set_chart_values([10, 45, 30, 80, 95])
        .build()
    )

    # 2. Inject it into a new manifest
    manifest = (
        ManifestBuilder()
        .add_page("auto_generated_route", analytics_page)
    )

    # 3. Export to disk
    manifest.export("sdk_manifest.json")
    print("SUCCESS: SDK generated 'sdk_manifest.json'.")

if __name__ == "__main__":
    main()
