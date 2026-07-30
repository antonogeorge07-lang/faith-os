import json
from typing import Dict, Any

class CompileError(Exception):
    """Custom exception for manifest compilation errors."""
    pass

class ManifestCompiler:
    def __init__(self):
        # Enforcing the structural mission: strict contracts for sovereign UI
        self.required_page_fields = {"app_name", "headline_kpi", "chart_values"}

    def parse(self, raw_json: str) -> Dict[str, Any]:
        """Lex/Parse phase: verifies syntax."""
        try:
            return json.loads(raw_json)
        except json.JSONDecodeError as e:
            raise CompileError(f"Syntax Error: Invalid JSON format. {str(e)}")

    def validate(self, ast: Dict[str, Any]) -> Dict[str, Any]:
        """Validation phase: enforces the component schema contract."""
        if not isinstance(ast, dict) or "pages" not in ast:
            raise CompileError("Structural Error: Manifest must include a 'pages' root object.")
        
        pages = ast.get("pages", {})
        if not isinstance(pages, dict) or not pages:
            raise CompileError("Structural Error: 'pages' must be a non-empty mapping.")

        for page_key, page_node in pages.items():
            if not isinstance(page_node, dict):
                raise CompileError(f"Type Error: Page '{page_key}' must be a JSON object.")
            
            missing = self.required_page_fields - page_node.keys()
            if missing:
                raise CompileError(f"Validation Error: Page '{page_key}' missing fields: {', '.join(missing)}")
            
            if not isinstance(page_node.get("chart_values"), list):
                 raise CompileError(f"Type Error: Page '{page_key}' 'chart_values' must be an array.")

        return ast

    def compile(self, raw_json: str) -> Dict[str, Any]:
        """Core execution loop for the compiler."""
        ast = self.parse(raw_json)
        validated_ast = self.validate(ast)
        return validated_ast
