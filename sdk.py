import json
from typing import List, Dict, Any

class PageBuilder:
    """Builder for Sovereign App Pages to ensure strict contract compliance."""
    def __init__(self, app_name: str):
        self.payload = {
            "app_name": app_name, 
            "headline_kpi": "---", 
            "chart_values": []
        }

    def set_kpi(self, kpi: str):
        self.payload["headline_kpi"] = kpi
        return self

    def set_chart_values(self, values: List[int]):
        self.payload["chart_values"] = values
        return self
        
    def add_custom_prop(self, key: str, value: Any):
        self.payload[key] = value
        return self

    def build(self) -> Dict[str, Any]:
        return self.payload

class ManifestBuilder:
    """Root Builder for the complete FAITH OS JSON Manifest."""
    def __init__(self):
        self.manifest = {"pages": {}}

    def add_page(self, route_id: str, page_payload: Dict[str, Any]):
        self.manifest["pages"][route_id] = page_payload
        return self

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.manifest, indent=indent)

    def export(self, filepath: str):
        with open(filepath, 'w') as f:
            f.write(self.to_json())
